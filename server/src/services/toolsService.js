import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { generateEmbedding } from './embeddingService.js';
import { vectorStore } from './vectorStore.js';
import { documentStore } from './documentStore.js';
import { executeRagPipeline } from './ragPipeline.js';

let genAI = null;

function getGenAI() {
  if (!config.gemini.apiKey || config.gemini.apiKey === 'your_gemini_api_key_here') return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  }
  return genAI;
}

/**
 * Tool 1: Deep Semantic Search
 */
export async function searchDocuments({ query, documentId, topK = 6, scoreThreshold = 0.05 }) {
  const startTime = Date.now();
  const queryVector = await generateEmbedding(query);
  let results = await vectorStore.search(queryVector, {
    topK,
    scoreThreshold,
    documentId
  });

  // Fallback if strict threshold was too high
  if ((!results || results.length === 0) && documentId) {
    results = await vectorStore.search(queryVector, {
      topK,
      scoreThreshold: 0.0,
      documentId
    });
  }

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

  // 1. First attempt: retrieve from documentStore chunks directly
  const doc = documentRecord || documentStore.getById(documentId);
  let chunks = [];

  if (doc && doc.chunks && doc.chunks.length > 0) {
    chunks = doc.chunks.map(c => ({
      payload: {
        pageNumber: c.pageNumber || 1,
        content: c.content,
        filename: doc.filename
      }
    }));
  } else {
    // 2. Vector search fallback with threshold 0.0
    const queryVec = await generateEmbedding('overview summary introduction key points');
    chunks = await vectorStore.search(queryVec, {
      topK: 15,
      scoreThreshold: 0.0,
      documentId
    });
  }

  if (!chunks || chunks.length === 0) {
    throw new Error('No indexed content found for this document.');
  }

  const filename = doc?.filename || chunks[0].payload.filename || 'Document';
  const combinedContext = chunks.slice(0, 10)
    .map((c, i) => `[Segment ${i+1} - p.${c.payload.pageNumber}]:\n${c.payload.content}`)
    .join('\n\n');

  const systemPrompt = `You are an expert executive document analyst. Summarize the provided document accurately, objectively, and thoroughly.
Organize your response with these sections:
1. **Executive Summary**
2. **Key Highlights & Points** (bullet points with page citations)
3. **Core Details or Metrics**
4. **Conclusion**`;

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
      logger.warn(`Gemini summarization failed: ${e.message}. Using offline extraction.`);
      summaryText = buildOfflineSummary(filename, chunks);
    }
  } else {
    summaryText = buildOfflineSummary(filename, chunks);
  }

  return {
    documentId,
    filename,
    summary: summaryText,
    chunkCount: chunks.length,
    latencyMs: Date.now() - startTime
  };
}

function buildOfflineSummary(filename, chunks) {
  let out = `### Summary for **${filename}**\n\n`;
  out += `*Analyzed ${chunks.length} extracted segments from the document.*\n\n`;
  out += `**Key Highlights:**\n`;

  const lines = [];
  for (const c of chunks) {
    const rawLines = c.payload.content
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 25 && !l.startsWith('http'));

    for (const line of rawLines.slice(0, 2)) {
      if (!lines.includes(line)) {
        lines.push(`- **(Page ${c.payload.pageNumber})**: ${line}`);
      }
      if (lines.length >= 7) break;
    }
    if (lines.length >= 7) break;
  }

  if (lines.length > 0) {
    out += lines.join('\n');
  } else {
    chunks.slice(0, 3).forEach(c => {
      out += `- **(Page ${c.payload.pageNumber})**: ${c.payload.content.slice(0, 200)}...\n`;
    });
  }

  out += `\n\n> *Add \`GEMINI_API_KEY\` to your \`.env\` file for conversational synthesis powered by Gemini 1.5 Flash.*`;
  return out;
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
    let chunks = await vectorStore.search(docQueryVector, {
      topK: 6,
      scoreThreshold: 0.05,
      documentId: docId
    });

    if (!chunks || chunks.length === 0) {
      chunks = await vectorStore.search(docQueryVector, {
        topK: 6,
        scoreThreshold: 0.0,
        documentId: docId
      });
    }

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
Provide a clear comparison with:
1. **Comparative Overview**
2. **Key Common Grounds**
3. **Critical Differences**`;

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
      comparisonText = buildOfflineComparison(docsData, focusTopic);
    }
  } else {
    comparisonText = buildOfflineComparison(docsData, focusTopic);
  }

  return {
    documents: docsData.map(d => ({ documentId: d.documentId, filename: d.filename, chunksRetrieved: d.chunks.length })),
    focusTopic,
    comparison: comparisonText,
    latencyMs: Date.now() - startTime
  };
}

function buildOfflineComparison(docsData, focusTopic) {
  let out = `### Comparative Analysis: ${docsData.map(d => d.filename).join(' vs ')}\n\n`;
  out += `**Focus Topic:** ${focusTopic}\n\n`;
  docsData.forEach(d => {
    out += `#### ${d.filename} (${d.chunks.length} sections analyzed)\n`;
    d.chunks.slice(0, 2).forEach(c => {
      out += `* *(Page ${c.payload.pageNumber})*: "${c.payload.content.slice(0, 180)}..."\n`;
    });
    out += '\n';
  });
  out += `> *Add \`GEMINI_API_KEY\` to \`.env\` for full AI comparative matrix.*`;
  return out;
}
