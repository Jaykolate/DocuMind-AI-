import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Cosine similarity for in-memory vector comparison
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// In-Memory Vector Store implementation as a fallback
class InMemoryVectorStore {
  constructor() {
    this.points = new Map(); // id -> { id, vector, payload }
    logger.info('Initialized in-memory vector store engine.');
  }

  async upsertPoints(points) {
    for (const pt of points) {
      this.points.set(String(pt.id), {
        id: pt.id,
        vector: pt.vector,
        payload: pt.payload
      });
    }
    return { status: 'ok', count: points.length };
  }

  async search(queryVector, options = {}) {
    const { topK = config.rag.topK, scoreThreshold = config.rag.scoreThreshold, documentId } = options;
    const candidates = [];

    for (const [id, point] of this.points.entries()) {
      // Document filter
      if (documentId && point.payload?.documentId !== documentId) {
        continue;
      }

      const score = cosineSimilarity(queryVector, point.vector);
      if (score >= scoreThreshold) {
        candidates.push({
          id: point.id,
          score,
          payload: point.payload
        });
      }
    }

    // Sort descending by score
    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, topK);
  }

  async deleteByDocumentId(documentId) {
    let deletedCount = 0;
    for (const [id, point] of this.points.entries()) {
      if (point.payload?.documentId === documentId) {
        this.points.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  async getCount() {
    return this.points.size;
  }
}

class VectorStoreService {
  constructor() {
    this.client = null;
    this.collectionName = config.qdrant.collectionName;
    this.isQdrantReady = false;
    this.inMemoryStore = new InMemoryVectorStore();
    this.initializationPromise = this.initialize();
  }

  async initialize() {
    if (!config.qdrant.url) {
      logger.warn('No QDRANT_URL provided. Vector store will operate in high-performance in-memory mode.');
      return;
    }

    try {
      const clientOptions = {
        url: config.qdrant.url,
        checkCompatibility: false
      };
      if (config.qdrant.apiKey) {
        clientOptions.apiKey = config.qdrant.apiKey;
      }

      this.client = new QdrantClient(clientOptions);

      // Test connection with timeout
      const collections = await Promise.race([
        this.client.getCollections(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Qdrant connection timeout (3000ms)')), 3000))
      ]);

      const collectionExists = collections.collections.some(c => c.name === this.collectionName);

      if (!collectionExists) {
        logger.info(`Creating Qdrant collection '${this.collectionName}' with 768 dimensions (Cosine)...`);
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: config.gemini.dimensions,
            distance: 'Cosine'
          }
        });
        logger.info(`Collection '${this.collectionName}' created successfully.`);
      } else {
        logger.info(`Connected to Qdrant collection '${this.collectionName}'.`);
      }

      this.isQdrantReady = true;
    } catch (err) {
      logger.warn(`Could not connect to Qdrant at ${config.qdrant.url}: ${err.message}. Using built-in in-memory vector store.`);
      this.isQdrantReady = false;
    }
  }

  async ensureReady() {
    await this.initializationPromise;
  }

  /**
   * Upsert document chunks with vector embeddings.
   * 
   * @param {Array<Object>} chunks - Chunks with embeddings
   */
  async upsertChunks(chunks) {
    await this.ensureReady();

    const points = chunks.map(chunk => {
      // Qdrant point IDs should be valid UUIDs or integers
      const pointId = uuidv4();
      return {
        id: pointId,
        vector: chunk.embedding,
        payload: {
          originalChunkId: chunk.id,
          documentId: chunk.documentId,
          filename: chunk.filename,
          pageNumber: chunk.pageNumber,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          metadata: chunk.metadata || {}
        }
      };
    });

    if (this.isQdrantReady && this.client) {
      try {
        await this.client.upsert(this.collectionName, {
          wait: true,
          points
        });
        logger.info(`Upserted ${points.length} points to Qdrant collection '${this.collectionName}'.`);
        // Also sync to inMemory store for fast fallback
        await this.inMemoryStore.upsertPoints(points);
        return { count: points.length, backend: 'qdrant' };
      } catch (err) {
        logger.error(`Qdrant upsert failed: ${err.message}. Saving to in-memory store.`);
        await this.inMemoryStore.upsertPoints(points);
        return { count: points.length, backend: 'in-memory-fallback' };
      }
    } else {
      await this.inMemoryStore.upsertPoints(points);
      logger.info(`Upserted ${points.length} points to in-memory store.`);
      return { count: points.length, backend: 'in-memory' };
    }
  }

  /**
   * Search for closest chunks to a query vector.
   * 
   * @param {Array<number>} queryVector - 768-dim float vector
   * @param {Object} options - { topK, scoreThreshold, documentId }
   * @returns {Promise<Array<Object>>} Retrieved chunks with score and payload
   */
  async search(queryVector, options = {}) {
    await this.ensureReady();

    const topK = options.topK || config.rag.topK;
    const scoreThreshold = options.scoreThreshold !== undefined ? options.scoreThreshold : config.rag.scoreThreshold;
    const documentId = options.documentId || null;

    if (this.isQdrantReady && this.client) {
      try {
        const filter = documentId
          ? {
              must: [
                {
                  key: 'documentId',
                  match: { value: documentId }
                }
              ]
            }
          : undefined;

        const results = await this.client.search(this.collectionName, {
          vector: queryVector,
          limit: topK,
          score_threshold: scoreThreshold,
          filter,
          with_payload: true
        });

        logger.debug(`Qdrant search returned ${results.length} chunks (threshold: ${scoreThreshold})`);
        return results.map(r => ({
          id: r.id,
          score: r.score,
          payload: r.payload
        }));
      } catch (err) {
        logger.error(`Qdrant search error: ${err.message}. Falling back to in-memory search.`);
        return this.inMemoryStore.search(queryVector, { topK, scoreThreshold, documentId });
      }
    }

    return this.inMemoryStore.search(queryVector, { topK, scoreThreshold, documentId });
  }

  /**
   * Delete all points belonging to a specific document.
   * 
   * @param {string} documentId 
   */
  async deleteByDocumentId(documentId) {
    await this.ensureReady();

    let deletedInQdrant = false;
    if (this.isQdrantReady && this.client) {
      try {
        await this.client.delete(this.collectionName, {
          wait: true,
          filter: {
            must: [
              {
                key: 'documentId',
                match: { value: documentId }
              }
            ]
          }
        });
        deletedInQdrant = true;
        logger.info(`Deleted points for documentId='${documentId}' from Qdrant.`);
      } catch (err) {
        logger.error(`Failed to delete points from Qdrant: ${err.message}`);
      }
    }

    const inMemoryDeleted = await this.inMemoryStore.deleteByDocumentId(documentId);
    return { deletedInQdrant, inMemoryDeleted };
  }

  /**
   * Returns current health and vector counts.
   */
  async getStatus() {
    await this.ensureReady();
    let qdrantCount = 0;
    if (this.isQdrantReady && this.client) {
      try {
        const info = await this.client.getCollection(this.collectionName);
        qdrantCount = info.points_count || info.vectors_count || 0;
      } catch (e) {
        qdrantCount = 0;
      }
    }

    const memoryCount = await this.inMemoryStore.getCount();

    return {
      isQdrantReady: this.isQdrantReady,
      backend: this.isQdrantReady ? 'qdrant' : 'in-memory',
      collectionName: this.collectionName,
      vectorCount: this.isQdrantReady ? qdrantCount : memoryCount,
      dimensions: config.gemini.dimensions
    };
  }
}

export const vectorStore = new VectorStoreService();
