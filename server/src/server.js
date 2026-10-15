import app from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { vectorStore } from './services/vectorStore.js';

const PORT = config.port;

async function startServer() {
  try {
    logger.info('Initializing NexusRAG Server...');
    await vectorStore.ensureReady();

    app.listen(PORT, () => {
      logger.info(`====================================================`);
      logger.info(`  NexusRAG Server running at: http://localhost:${PORT}`);
      logger.info(`  Health check: http://localhost:${PORT}/api/health`);
      logger.info(`  Gemini Model: ${config.gemini.chatModel}`);
      logger.info(`  Gemini Embedding: ${config.gemini.embeddingModel}`);
      logger.info(`  Qdrant URL: ${config.qdrant.url}`);
      logger.info(`====================================================`);
    });
  } catch (err) {
    logger.error('Failed to start NexusRAG Server:', err.message);
    process.exit(1);
  }
}

startServer();
