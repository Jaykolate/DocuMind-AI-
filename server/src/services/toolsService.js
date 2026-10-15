import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { generateEmbedding } from './embeddingService.js';
import { vectorStore } from './vectorStore.js';
import { executeRagPipeline } from './ragPipeline.js';

let genAI = null;

function getGenAI() {
  if (!config.gemini.apiKey) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  }
  return genAI;
}

/**
 * Tool 1: Deep Semantic Search
 */
export async function searchDocuments({ query, documentId, topK = 6, scoreThreshold = 0.25 }) {
  const startTime = Date.now();
  const queryVector = await generateEmbedding(query);
  const results = await vectorStore.search(queryVector, {
    topK,
    scoreThreshold,
    documentId
  });

  const formattedResults = results.map(r => ({
    id: r.id,
    similarityScore: Math.round(r.score * 100) / 100,
    documentId: r.payload.documentId,
    filename: r.payload.filename,
    pageNumber: r.payload.pageNumber || 1,
    chunkIndex: r.payload.chunkIndex,
    content: r.payload.content
  }));

  return {
    query,
    totalMatches: formattedResults.length,
    results: formattedResults,
    latencyMs: Date.now() - startTime
  };
}

/**
 * Tool 2: Document Summarization
 */
export async function summarizeDocument({ documentId, style = 'detailed', documentRecord }) {
  const startTime = Date.now();

  // Retrieve representative chunks for this document
  // Search with generic exploratory embedding to get diverse content
  const exploratoryVector = await generateEmbedding('main overview objectives findings summary key points');
  const chunks = await vectorStore.search(exploratoryVector, {
    topK: 12,
    scoreThreshold: 0.1,
    documentId
  });

  if (!chunks || chunks.length === 0) {
    throw new Error('No indexed content found for this document.');
  }

  const filename = documentRecord?.filename || chunks[0].payload.filename || 'Document';
  const combinedContext = chunks
    .map((c, i) => `[Segment ${i+1} - p.${c.payload.pageNumber}]:\n${c.payload.content}`)
    .join('\n\n');

  const systemPrompt = `You are an expert executive document analyst. Summarize the provided document accurately, objectively, and thoroughly.
Organize your response with these sections:
1. **Executive Summary** (high-level objective and core thesis)
2. **Key Findings & Main Themes** (bullet points with citations like [p. X])
3. **Important Nuances, Metrics, or Data**
4. **Actionable Takeaways / Conclusions**`;

  const userPrompt = `Document: ${filename}\n\nCONTENT SEGMENTS:\n${combinedContext}\n\nPlease generate a ${style} summary based strictly on the above text:`;

  const aiClient = getGenAI();
  let summaryText = '';

  if (aiClient) {
    try {
      const model = aiClient.getGenerativeModel({ model: config.gemini.chatModel, systemInstruction: systemPrompt });
      const result = await model.generateContent(userPrompt);
      const res = await result.response;
      summaryText = res.text();
    } catch (e) {
      logger.error(`Document summarization failed: ${e.message}`);
      throw new Error(`Summarization failed: ${e.message}`);
    }
  } else {
    summaryText = `### Executive Summary for ${filename}\n\n*Document contains ${chunks.length} extracted segments.*\n\n` +
      `**Key Highlights:**\n` +
      chunks.slice(0, 3).map(c => `- **(Page ${c.payload.pageNumber})**: ${c.payload.content.slice(0, 180)}...`).join('\n') +
      `\n\n*(Connect Gemini API Key in .env for full synthesized summary)*`;
  }

  return {
    documentId,
    filename,
    summary: summaryText,
    chunkCount: chunks.length,
    latencyMs: Date.now() - startTime
  };
}

/**
 * Tool 3: Multi-Document Comparison
 */
export async function compareDocuments({ documentIds, focusTopic = 'general comparison', documentMap = {} }) {
  const startTime = Date.now();

  if (!Array.isArray(documentIds) || documentIds.length < 2) {
    throw new Error('At least two document IDs must be provided for comparison.');
  }

  const docsData = [];

  for (const docId of documentIds) {
    const docQueryVector = await generateEmbedding(focusTopic);
    const chunks = await vectorStore.search(docQueryVector, {
      topK: 6,
      scoreThreshold: 0.1,
      documentId: docId
    });

    const docName = documentMap[docId]?.filename || (chunks[0]?.payload?.filename) || `Document ${docId}`;
    docsData.push({
      documentId: docId,
      filename: docName,
      chunks
    });
  }

  const promptSegments = docsData.map((d, idx) => {
    const textBlocks = d.chunks.map(c => `[p.${c.payload.pageNumber}] ${c.payload.content}`).join('\n');
    return `=== DOCUMENT ${idx + 1}: ${d.filename} ===\n${textBlocks || 'No matching segments found.'}`;
  }).join('\n\n');

  const systemPrompt = `You are a cross-document intelligence analyst.
Compare and contrast the provided documents regarding the topic: "${focusTopic}".
Provide a clear, structured comparison with:
1. **Comparative Overview**
2. **Key Common Grounds / Agreements**
3. **Critical Differences & Contrasts**
4. **Comparative Matrix / Synthesis**
Cite documents clearly by name and page.`;

  const userPrompt = `Compare the following documents:\n\n${promptSegments}`;

  const aiClient = getGenAI();
  let comparisonText = '';

  if (aiClient) {
    try {
      const model = aiClient.getGenerativeModel({ model: config.gemini.chatModel, systemInstruction: systemPrompt });
      const result = await model.generateContent(userPrompt);
      const res = await result.response;
      comparisonText = res.text();
    } catch (e) {
      logger.error(`Document comparison failed: ${e.message}`);
      throw new Error(`Comparison failed: ${e.message}`);
    }
  } else {
    comparisonText = `### Comparative Analysis (${docsData.map(d => d.filename).join(' vs ')})\n\n` +
      `**Focus Topic:** ${focusTopic}\n\n` +
      docsData.map(d => `* **${d.filename}**: Retrieved ${d.chunks.length} relevant sections.`).join('\n') +
      `\n\n*(Connect Gemini API Key in .env for full AI comparative synthesis)*`;
  }

  return {
    documents: docsData.map(d => ({ documentId: d.documentId, filename: d.filename, chunksRetrieved: d.chunks.length })),
    focusTopic,
    comparison: comparisonText,
    latencyMs: Date.now() - startTime
  };
}

/**
 * Constrained Agent Workflow Router:
 * Analyzes request and dispatches to appropriate tool.
 */
export async function agentOrchestrator({ query, documentId, documentIds, style, focusTopic }) {
  const clean = (query || '').toLowerCase().trim();

  if (documentIds && documentIds.length >= 2) {
    return {
      tool: 'compare_documents',
      data: await compareDocuments({ documentIds, focusTopic: query || focusTopic })
    };
  }

  if (clean.startsWith('summarize') || clean.includes('give me a summary') || clean.includes('overview of')) {
    if (documentId) {
      return {
        tool: 'summarize_document',
        data: await summarizeDocument({ documentId, style })
      };
    }
  }

  if (clean.startsWith('search for') || clean.startsWith('find chunks') || clean.startsWith('find sections')) {
    const searchQuery = clean.replace(/^(search for|find chunks|find sections)/i, '').trim();
    return {
      tool: 'search_documents',
      data: await searchDocuments({ query: searchQuery || query, documentId })
    };
  }

  // Default: RAG Question Answering
  return {
    tool: 'rag_qa',
    data: await executeRagPipeline({ question: query, documentId })
  };
}
