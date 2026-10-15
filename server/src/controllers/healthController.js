import { config } from '../config/env.js';
import { vectorStore } from '../services/vectorStore.js';
import { documentStore } from '../services/documentStore.js';

export async function getHealth(req, res) {
  const vectorStatus = await vectorStore.getStatus();
  const allDocs = documentStore.getAll();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    services: {
      gemini: {
        configured: Boolean(config.gemini.apiKey),
        chatModel: config.gemini.chatModel,
        embeddingModel: config.gemini.embeddingModel,
        dimensions: config.gemini.dimensions
      },
      vectorStore: vectorStatus,
      documentStore: {
        totalDocuments: allDocs.length,
        indexedDocuments: allDocs.filter(d => d.status === 'indexed').length
      }
    }
  });
}
