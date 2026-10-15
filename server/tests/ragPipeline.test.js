import { describe, it, expect, beforeEach } from 'vitest';
import { executeRagPipeline } from '../src/services/ragPipeline.js';
import { vectorStore } from '../src/services/vectorStore.js';
import { generateEmbedding } from '../src/services/embeddingService.js';

describe('RAG Pipeline & Grounding Guardrails', () => {
  beforeEach(async () => {
    await vectorStore.deleteByDocumentId('grounding-doc');
  });

  it('should return insufficient evidence response when no chunks match', async () => {
    const result = await executeRagPipeline({
      question: 'What is the secret recipe for Martian space fuel?',
      topK: 3,
      scoreThreshold: 0.95 // impossibly high threshold for empty/unrelated store
    });

    expect(result.isGrounded).toBe(false);
    expect(result.answer).toContain('cannot find enough evidence in the uploaded documents');
    expect(result.sources).toEqual([]);
    expect(result.metrics.chunksRetrieved).toBe(0);
  });

  it('should return grounded sources and citations when matching chunks exist', async () => {
    // Generate actual embedding for sample chunk
    const chunkText = 'NexusRAG features dual-engine vector storage with real-time citations and zero hallucination guardrails.';
    const embedding = await generateEmbedding(chunkText);

    await vectorStore.upsertChunks([
      {
        id: 'chunk-grounding-1',
        documentId: 'grounding-doc',
        filename: 'nexus_spec.pdf',
        pageNumber: 3,
        chunkIndex: 0,
        content: chunkText,
        embedding
      }
    ]);

    const result = await executeRagPipeline({
      question: 'NexusRAG features dual-engine vector storage with real-time citations',
      documentId: 'grounding-doc',
      topK: 2,
      scoreThreshold: 0.0
    });

    expect(result.isGrounded).toBe(true);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources[0].filename).toBe('nexus_spec.pdf');
    expect(result.sources[0].pageNumber).toBe(3);
    expect(result.sources[0].excerpt).toContain('NexusRAG features dual-engine');
    expect(result.metrics.retrievalLatencyMs).toBeDefined();
    expect(result.metrics.totalLatencyMs).toBeGreaterThanOrEqual(0);
  });
});
