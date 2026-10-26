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

// In-Memory Vector Store implementation as a fallback for offline/local testing
class InMemoryVectorStore {
  constructor() {
    this.points = new Map();
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
    const { topK = config.rag.topK, scoreThreshold = 0.0, documentId } = options;
    const candidates = [];

    for (const [id, point] of this.points.entries()) {
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
    this.collectionName = config.qdrant.collectionName || 'DocuMind';
    this.isQdrantReady = false;
    this.qdrantExpectedDim = null;
    this.inMemoryStore = new InMemoryVectorStore();
    this.lastConnectionError = null;
    this.initializationPromise = this.initialize();
  }

  sanitizeUrl(rawUrl) {
    if (!rawUrl) return 'not-configured';
    try {
      const u = new URL(rawUrl);
      return `${u.protocol}//${u.host}`;
    } catch (e) {
      return rawUrl;
    }
  }

  async initialize() {
    if (config.isTest) {
      logger.info('[QDRANT] Test mode detected. Using in-memory vector store for unit tests.');
      this.isQdrantReady = false;
      return;
    }

    const rawUrl = config.qdrant.url;
    const apiKey = config.qdrant.apiKey;
    const sanitizedUrl = this.sanitizeUrl(rawUrl);

    // Check for common misconfiguration: Cloud API key provided with localhost URL
    const isCloudKey = apiKey && apiKey.startsWith('eyJ');
    const isLocalhost = !rawUrl || rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1');

    if (isCloudKey && isLocalhost) {
      const warningMsg = `[QDRANT CONFIG MISMATCH] A Qdrant Cloud API key is configured, but QDRANT_URL is still pointing to '${rawUrl}'. Qdrant Cloud requires your cluster URL (e.g. https://<cluster-id>.<region>.<provider>.cloud.qdrant.io:6333).`;
      logger.error(warningMsg);
      this.lastConnectionError = warningMsg;
    }

    if (!rawUrl) {
      logger.warn('[QDRANT] No QDRANT_URL provided. Vector store will operate in local in-memory fallback mode.');
      return;
    }

    try {
      logger.info(`[QDRANT] Attempting connection to host: ${sanitizedUrl}...`);

      const clientOptions = {
        url: rawUrl,
        checkCompatibility: false
      };
      if (apiKey) {
        clientOptions.apiKey = apiKey;
      }

      this.client = new QdrantClient(clientOptions);

      // Verify connection with timeout
      const collectionsResponse = await Promise.race([
        this.client.getCollections(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Connection to Qdrant at ${sanitizedUrl} timed out after 5000ms`)), 5000)
        )
      ]);

      const existingCollections = collectionsResponse.collections.map(c => c.name);
      logger.info(`[QDRANT] Connected successfully to ${sanitizedUrl}. Available collections: [${existingCollections.join(', ')}]`);

      const collectionExists = existingCollections.includes(this.collectionName);

      if (!collectionExists) {
        const notFoundMsg = `[QDRANT] Collection '${this.collectionName}' does not exist on host ${sanitizedUrl}. Existing collections: [${existingCollections.join(', ')}]`;
        logger.warn(notFoundMsg);
        this.lastConnectionError = notFoundMsg;
        // Do not automatically delete or force creation without checking
        this.isQdrantReady = false;
        return;
      }

      // Inspect collection configuration and vector dimensions
      const collectionInfo = await this.client.getCollection(this.collectionName);
      const vectorParams = collectionInfo.config?.params?.vectors;

      if (vectorParams && typeof vectorParams === 'object') {
        // Can be a single vector config { size, distance } or named vectors
        if (typeof vectorParams.size === 'number') {
          this.qdrantExpectedDim = vectorParams.size;
        } else if (vectorParams['']?.size) {
          this.qdrantExpectedDim = vectorParams[''].size;
        }
      }

      const pointsCount = collectionInfo.points_count || collectionInfo.vectors_count || 0;
      logger.info(
        `[QDRANT] Verified collection '${this.collectionName}': ${pointsCount} existing points, expected vector dimension = ${this.qdrantExpectedDim || 'unknown'}`
      );

      this.isQdrantReady = true;
      this.lastConnectionError = null;
    } catch (err) {
      const errMsg = `Could not connect to Qdrant at ${sanitizedUrl}: ${err.message}`;
      logger.error(`[QDRANT ERROR] ${errMsg}`);
      this.lastConnectionError = errMsg;
      this.isQdrantReady = false;
    }
  }

  async ensureReady() {
    await this.initializationPromise;
  }

  /**
   * Re-check connection and reload Qdrant status.
   */
  async reconnect() {
    this.initializationPromise = this.initialize();
    await this.initializationPromise;
    return this.isQdrantReady;
  }

  /**
   * Returns the vector dimension expected by the active Qdrant collection,
   * or null if not yet determined.
   */
  getExpectedDimensions() {
    return this.qdrantExpectedDim;
  }

  /**
   * Insert document chunks into Qdrant collection 'DocuMind'.
   * Waits for Qdrant insertion confirmation before completing.
   * Throws an explicit error if Qdrant fails or is not connected.
   * 
   * @param {Array<Object>} chunks - Chunks with embeddings
   * @param {Object} context - Diagnostic metadata for logging
   */
  async upsertChunks(chunks, context = {}) {
    await this.ensureReady();

    const { documentId, filename, extractedLength } = context;
    const chunkCount = chunks.length;
    const embeddingDim = chunks[0]?.embedding?.length || 0;
    const sanitizedUrl = this.sanitizeUrl(config.qdrant.url);

    logger.info(`[INGEST PIPELINE] Preparing insertion into collection '${this.collectionName}':`);
    logger.info(`  • Document ID:        ${documentId || 'unknown'}`);
    logger.info(`  • Filename:           ${filename || 'unknown'}`);
    logger.info(`  • Extracted Text:     ${extractedLength || 'unknown'} characters`);
    logger.info(`  • Chunk Count:        ${chunkCount}`);
    logger.info(`  • Vector Dimension:   ${embeddingDim}`);
    logger.info(`  • Target Collection:  ${this.collectionName}`);
    logger.info(`  • Qdrant Host:        ${sanitizedUrl}`);

    // Check dimension compatibility if known
    if (this.isQdrantReady && this.qdrantExpectedDim && this.qdrantExpectedDim !== embeddingDim) {
      const dimError = `Vector dimension mismatch for Qdrant collection '${this.collectionName}': collection expects ${this.qdrantExpectedDim} dimensions, but embedding generator produced ${embeddingDim} dimensions.`;
      logger.error(`[INGEST ERROR] ${dimError}`);
      throw new Error(dimError);
    }

    const points = chunks.map(chunk => {
      const pointId = uuidv4();
      return {
        id: pointId,
        vector: chunk.embedding,
        payload: {
          originalChunkId: chunk.id,
          documentId: chunk.documentId,
          filename: chunk.filename,
          pageNumber: chunk.pageNumber || 1,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          metadata: chunk.metadata || {}
        }
      };
    });

    // Check if Qdrant is connected
    if (!this.isQdrantReady || !this.client) {
      const reason = this.lastConnectionError || `Qdrant service at ${sanitizedUrl} is not connected or collection '${this.collectionName}' is missing.`;
      logger.error(`[INGEST ERROR] Cannot insert points into Qdrant collection '${this.collectionName}': ${reason}`);
      
      // Also sync to in-memory store
      await this.inMemoryStore.upsertPoints(points);

      // In unit test environment, allow tests to verify vector store logic with in-memory store
      if (config.isTest) {
        return {
          count: points.length,
          backend: 'in-memory-test',
          status: 'ok',
          collection: this.collectionName
        };
      }

      // Throw explicit error in dev/production so caller knows Qdrant Cloud did not receive the points
      throw new Error(`Failed to insert points into Qdrant collection '${this.collectionName}': ${reason}`);
    }

    // Perform Qdrant insertion with wait: true to guarantee persistence
    try {
      logger.info(`[QDRANT INSERT] Sending ${points.length} points to collection '${this.collectionName}' (wait=true)...`);
      
      const response = await this.client.upsert(this.collectionName, {
        wait: true,
        points
      });

      logger.info(`[QDRANT INSERT CONFIRMED] Successfully inserted ${points.length} points into '${this.collectionName}'. Status: ${response?.status || 'ok'}`);

      // Sync to local memory cache as well
      await this.inMemoryStore.upsertPoints(points);

      return {
        count: points.length,
        backend: 'qdrant',
        status: response?.status || 'completed',
        collection: this.collectionName
      };
    } catch (err) {
      const insertError = `Qdrant upsert failed on collection '${this.collectionName}': ${err.message}`;
      logger.error(`[INGEST ERROR] ${insertError}`);
      throw new Error(insertError);
    }
  }

  /**
   * Search for closest chunks to a query vector.
   */
  async search(queryVector, options = {}) {
    await this.ensureReady();

    const topK = options.topK || config.rag.topK;
    const scoreThreshold = options.scoreThreshold !== undefined ? options.scoreThreshold : 0.0;
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
          score_threshold: scoreThreshold > 0 ? scoreThreshold : undefined,
          filter,
          with_payload: true
        });

        logger.debug(`[QDRANT SEARCH] Returned ${results.length} chunks from '${this.collectionName}'`);
        return results.map(r => ({
          id: r.id,
          score: r.score,
          payload: r.payload
        }));
      } catch (err) {
        logger.error(`[QDRANT SEARCH ERROR] ${err.message}. Falling back to in-memory search.`);
        return this.inMemoryStore.search(queryVector, { topK, scoreThreshold, documentId });
      }
    }

    return this.inMemoryStore.search(queryVector, { topK, scoreThreshold, documentId });
  }

  /**
   * Delete all points belonging to a specific document.
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
        logger.info(`[QDRANT DELETE] Deleted points for documentId='${documentId}' from '${this.collectionName}'.`);
      } catch (err) {
        logger.error(`[QDRANT DELETE ERROR] Failed to delete points: ${err.message}`);
      }
    }

    const inMemoryDeleted = await this.inMemoryStore.deleteByDocumentId(documentId);
    return { deletedInQdrant, inMemoryDeleted };
  }

  /**
   * Returns current health, connection state, and vector counts.
   */
  async getStatus() {
    await this.ensureReady();
    let qdrantCount = 0;
    let collectionInfo = null;

    if (this.isQdrantReady && this.client) {
      try {
        const info = await this.client.getCollection(this.collectionName);
        qdrantCount = info.points_count || info.vectors_count || 0;
        collectionInfo = {
          pointsCount: qdrantCount,
          vectorSize: this.qdrantExpectedDim,
          status: info.status
        };
      } catch (e) {
        qdrantCount = 0;
      }
    }

    const memoryCount = await this.inMemoryStore.getCount();

    return {
      isQdrantReady: this.isQdrantReady,
      backend: this.isQdrantReady ? 'qdrant' : 'in-memory',
      collectionName: this.collectionName,
      qdrantHost: this.sanitizeUrl(config.qdrant.url),
      vectorCount: this.isQdrantReady ? qdrantCount : memoryCount,
      qdrantPointsCount: qdrantCount,
      inMemoryPointsCount: memoryCount,
      dimensions: this.qdrantExpectedDim || config.gemini.dimensions,
      lastError: this.lastConnectionError,
      collectionInfo
    };
  }
}

export const vectorStore = new VectorStoreService();
