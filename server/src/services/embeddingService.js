import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

let genAIInstance = null;

function getGenAI() {
  if (!config.gemini.apiKey) {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(config.gemini.apiKey);
  }
  return genAIInstance;
}

/**
 * Generate a deterministic 768-dimension pseudo-embedding vector for offline / mock testing mode
 * when live Gemini API key is not configured.
 */
function generateDeterministicVector(text, dimensions = 768) {
  const vector = new Float32Array(dimensions);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  // Seeded pseudo-random numbers
  let seed = Math.abs(hash) || 1234567;
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const val = (seed / 233280.0) * 2 - 1;
    vector[i] = val;
    norm += val * val;
  }

  norm = Math.sqrt(norm);
  return Array.from(vector).map(v => (norm > 0 ? v / norm : 0));
}

/**
 * Generates an embedding vector for a single string.
 * 
 * @param {string} text - Input text
 * @returns {Promise<Array<number>>} 768-dimension float vector
 */
export async function generateEmbedding(text) {
  const startTime = Date.now();
  const cleanText = (text || '').trim();

  if (!cleanText) {
    return new Array(config.gemini.dimensions).fill(0);
  }

  const genAI = getGenAI();

  if (!genAI) {
    logger.warn('GEMINI_API_KEY is not configured. Using deterministic fallback embedding.');
    return generateDeterministicVector(cleanText, config.gemini.dimensions);
  }

  try {
    const model = genAI.getGenerativeModel({ model: config.gemini.embeddingModel });
    const result = await model.embedContent(cleanText);

    if (result && result.embedding && Array.isArray(result.embedding.values)) {
      const duration = Date.now() - startTime;
      logger.debug(`Generated embedding for text (${cleanText.length} chars) in ${duration}ms using ${config.gemini.embeddingModel}`);
      return result.embedding.values;
    } else {
      throw new Error('Unexpected embedding response format from Gemini API');
    }
  } catch (error) {
    logger.error(`Gemini embedding generation failed (${config.gemini.embeddingModel}): ${error.message}`);
    if (process.env.NODE_ENV === 'test' || !config.gemini.apiKey) {
      return generateDeterministicVector(cleanText, config.gemini.dimensions);
    }
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

/**
 * Generates embeddings in batch for multiple chunks.
 * 
 * @param {Array<string>} texts - List of chunk texts
 * @returns {Promise<Array<Array<number>>>} List of 768-dim vectors
 */
export async function generateBatchEmbeddings(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const startTime = Date.now();
  const genAI = getGenAI();

  if (!genAI) {
    logger.warn('GEMINI_API_KEY is not configured. Using deterministic fallback embeddings for batch.');
    return texts.map(t => generateDeterministicVector(t, config.gemini.dimensions));
  }

  try {
    const model = genAI.getGenerativeModel({ model: config.gemini.embeddingModel });

    // Process in batches of 20 to avoid payload size or rate limit caps
    const BATCH_SIZE = 20;
    const results = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batchSlice = texts.slice(i, i + BATCH_SIZE);
      const batchRequests = batchSlice.map(t => ({
        content: { parts: [{ text: t }] }
      }));

      const batchResponse = await model.batchEmbedContents({
        requests: batchRequests
      });

      if (batchResponse && Array.isArray(batchResponse.embeddings)) {
        for (const emb of batchResponse.embeddings) {
          results.push(emb.values);
        }
      } else {
        // Fallback to sequential if batch response format differed
        for (const t of batchSlice) {
          const single = await model.embedContent(t);
          results.push(single.embedding.values);
        }
      }
    }

    const duration = Date.now() - startTime;
    logger.info(`Generated batch embeddings for ${texts.length} items in ${duration}ms`);
    return results;
  } catch (error) {
    logger.error(`Batch embedding error: ${error.message}. Falling back to individual processing.`);
    // Fallback: try individual items
    const fallbackResults = [];
    for (const text of texts) {
      try {
        const emb = await generateEmbedding(text);
        fallbackResults.push(emb);
      } catch (e) {
        fallbackResults.push(generateDeterministicVector(text, config.gemini.dimensions));
      }
    }
    return fallbackResults;
  }
}
