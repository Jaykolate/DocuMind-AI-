import { executeRagPipeline } from '../services/ragPipeline.js';
import { logger } from '../utils/logger.js';

export async function chat(req, res, next) {
  try {
    const { question, documentId, conversationHistory, topK, scoreThreshold } = req.body;

    logger.info(`Processing chat query: "${question.slice(0, 50)}..." (filter docId=${documentId || 'all'})`);

    const result = await executeRagPipeline({
      question,
      documentId,
      conversationHistory,
      topK,
      scoreThreshold
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}
