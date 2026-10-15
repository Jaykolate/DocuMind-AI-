import app from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { vectorStore } from './services/vectorStore.js';
import { documentStore } from './services/documentStore.js';
import { generateBatchEmbeddings } from './services/embeddingService.js';

const PORT = config.port;

async function syncExistingDocuments() {
  const docs = documentStore.getAll();
  for (const doc of docs) {
    const full = documentStore.getById(doc.id);
    if (full && full.chunks && full.chunks.length > 0) {
      try {
        const chunkTexts = full.chunks.map(c => c.content);
        const embeddings = await generateBatchEmbeddings(chunkTexts);
        const chunksWithEmbeddings = full.chunks.map((c, idx) => ({
          ...c,
          embedding: embeddings[idx]
        }));
        await vectorStore.upsertChunks(chunksWithEmbeddings);
        logger.info(`Synced ${full.chunks.length} chunks for '${doc.filename}' into vector store.`);
      } catch (err) {
        logger.warn(`Could not sync chunks for '${doc.filename}': ${err.message}`);
      }
    }
  }
}

async function startServer() {
  try {
    logger.info('Initializing NexusRAG Server...');
    await vectorStore.ensureReady();
    await syncExistingDocuments();

    app.listen(PORT, () => {
      logger.info(`====================================================`);
      logger.info(`  NexusRAG Server running at: http://localhost:${PORT}`);
      logger.info(`  Health check: http://localhost:${PORT}/api/health`);
      logger.info(`  Gemini Model: ${config.gemini.chatModel}`);
      logger.info(`  Gemini Embedding: ${config.gemini.embeddingModel}`);
      logger.info(`====================================================`);
    });
  } catch (err) {
    logger.error('Failed to start NexusRAG Server:', err.message);
    process.exit(1);
  }
}

startServer();
