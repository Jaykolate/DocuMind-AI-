import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

let genAIInstance = null;

function getGenAI() {
  if (!config.gemini.apiKey || config.gemini.apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(config.gemini.apiKey);
  }
  return genAIInstance;
}

function normalizeVector(vec, targetDim = 768) {
  const sliced = vec.length > targetDim ? vec.slice(0, targetDim) : vec;
  let norm = 0;
  for (let i = 0; i < sliced.length; i++) norm += sliced[i] * sliced[i];
  norm = Math.sqrt(norm);
  if (norm === 0) return Array.from(sliced);
  return Array.from(sliced).map(v => v / norm);
}

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateTokenProjectionVector(text, dimensions = 768) {
  const vector = new Float32Array(dimensions);
  if (!text || typeof text !== 'string') return Array.from(vector);

  const clean = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const words = clean.split(/\s+/).filter(w => w.length > 1);

  if (words.length === 0) {
    return Array.from(vector);
  }

  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'for', 'with', 'to', 'of'
  ]);

  for (const word of words) {
    const isStop = stopWords.has(word);
    const weight = isStop ? 0.4 : 1.5;

    const bucket = hashString(word) % dimensions;
    vector[bucket] += weight;

    if (word.length >= 4) {
      for (let i = 0; i <= word.length - 3; i++) {
        const shingle = word.slice(i, i + 3);
        const shingleBucket = hashString(shingle) % dimensions;
        vector[shingleBucket] += 0.3;
      }
    }
  }

  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]}_${words[i+1]}`;
    const bigramBucket = hashString(bigram) % dimensions;
    vector[bigramBucket] += 1.0;
  }

  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }

  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= norm;
    }
  }

  return Array.from(vector);
}

export async function generateEmbedding(text) {
  const cleanText = (text || '').trim();

  if (!cleanText) {
    return new Array(config.gemini.dimensions).fill(0);
  }

  const genAI = getGenAI();

  if (!genAI) {
    return generateTokenProjectionVector(cleanText, config.gemini.dimensions);
  }

  try {
    const model = genAI.getGenerativeModel({ model: config.gemini.embeddingModel });
    const result = await model.embedContent(cleanText);

    if (result && result.embedding && Array.isArray(result.embedding.values)) {
      return normalizeVector(result.embedding.values, config.gemini.dimensions);
    }
  } catch (error) {
    logger.warn(`Gemini embedding failed (${error.message}). Using local token projection.`);
  }

  return generateTokenProjectionVector(cleanText, config.gemini.dimensions);
}

export async function generateBatchEmbeddings(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const genAI = getGenAI();

  if (!genAI) {
    return texts.map(t => generateTokenProjectionVector(t, config.gemini.dimensions));
  }

  try {
    const model = genAI.getGenerativeModel({ model: config.gemini.embeddingModel });
    const results = [];
    const BATCH_SIZE = 10;

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batchSlice = texts.slice(i, i + BATCH_SIZE);
      for (const t of batchSlice) {
        try {
          const single = await model.embedContent(t);
          results.push(normalizeVector(single.embedding.values, config.gemini.dimensions));
        } catch (e) {
          results.push(generateTokenProjectionVector(t, config.gemini.dimensions));
        }
      }
    }
    return results;
  } catch (error) {
    return texts.map(t => generateTokenProjectionVector(t, config.gemini.dimensions));
  }
}
