import { describe, it, expect, beforeEach } from 'vitest';
import { vectorStore } from '../src/services/vectorStore.js';

describe('Vector Store Service (In-Memory & Qdrant Engine)', () => {
  beforeEach(async () => {
    await vectorStore.deleteByDocumentId('test-doc-1');
    await vectorStore.deleteByDocumentId('test-doc-2');
  });

  it('should upsert chunks and search by vector similarity', async () => {
    // 768-dim mock vectors
    const vecA = new Array(768).fill(0.01);
    vecA[0] = 0.9;
    const vecB = new Array(768).fill(0.01);
    vecB[1] = 0.9;

    const chunks = [
      {
        id: 'chunk-1',
        documentId: 'test-doc-1',
        filename: 'report.pdf',
        pageNumber: 1,
        chunkIndex: 0,
        content: 'Vector databases enable high dimensional semantic search.',
        embedding: vecA
      },
      {
        id: 'chunk-2',
        documentId: 'test-doc-2',
        filename: 'recipe.docx',
        pageNumber: 2,
        chunkIndex: 0,
        content: 'Chocolate chip cookies require flour and sugar.',
        embedding: vecB
      }
    ];

    await vectorStore.upsertChunks(chunks);

    // Search with query vector close to vecA
    const queryVec = new Array(768).fill(0.01);
    queryVec[0] = 0.85;

    const results = await vectorStore.search(queryVec, { topK: 2, scoreThreshold: 0.1 });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].payload.documentId).toBe('test-doc-1');
    expect(results[0].payload.content).toContain('Vector databases');
    expect(results[0].score).toBeGreaterThan(0.7);
  });

  it('should filter search results by documentId', async () => {
    const vec = new Array(768).fill(0.05);

    await vectorStore.upsertChunks([
      {
        id: 'c1',
        documentId: 'test-doc-1',
        filename: 'doc1.pdf',
        pageNumber: 1,
        chunkIndex: 0,
        content: 'Doc 1 content here.',
        embedding: vec
      },
      {
        id: 'c2',
        documentId: 'test-doc-2',
        filename: 'doc2.pdf',
        pageNumber: 1,
        chunkIndex: 0,
        content: 'Doc 2 content here.',
        embedding: vec
      }
    ]);

    const results = await vectorStore.search(vec, {
      topK: 5,
      documentId: 'test-doc-2'
    });

    expect(results.length).toBe(1);
    expect(results[0].payload.documentId).toBe('test-doc-2');
  });

  it('should delete vectors by document ID', async () => {
    const vec = new Array(768).fill(0.03);

    await vectorStore.upsertChunks([
      {
        id: 'del-1',
        documentId: 'test-doc-1',
        filename: 'del.pdf',
        pageNumber: 1,
        chunkIndex: 0,
        content: 'To be deleted.',
        embedding: vec
      }
    ]);

    let res = await vectorStore.search(vec, { documentId: 'test-doc-1' });
    expect(res.length).toBe(1);

    await vectorStore.deleteByDocumentId('test-doc-1');

    res = await vectorStore.search(vec, { documentId: 'test-doc-1' });
    expect(res.length).toBe(0);
  });
});
