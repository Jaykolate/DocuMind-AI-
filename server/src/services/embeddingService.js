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

function normalizeVector(vec) {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm === 0) return Array.from(vec);
  return Array.from(vec).map(v => v / norm);
}

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateTokenProjectionVector(text, dimensions = config.gemini.dimensions) {
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

  return normalizeVector(vector);
}

export async function generateEmbedding(text) {
  const cleanText = (text || '').trim();
  const targetDim = config.gemini.dimensions;

  if (!cleanText) {
    return new Array(targetDim).fill(0);
  }

  const genAI = getGenAI();

  if (!genAI) {
    return generateTokenProjectionVector(cleanText, targetDim);
  }

  try {
    const model = genAI.getGenerativeModel({ model: config.gemini.embeddingModel });
    // Google Gemini embedContent with native or specified dimensionality
    const requestPayload = {
      content: { parts: [{ text: cleanText }] },
      ...(targetDim ? { outputDimensionality: targetDim } : {})
    };

    const result = await model.embedContent(requestPayload);

    if (result && result.embedding && Array.isArray(result.embedding.values)) {
      return normalizeVector(result.embedding.values);
    }
    throw new Error('Gemini API returned an empty embedding response.');
  } catch (error) {
    logger.error(`[EMBEDDING ERROR] Failed to generate embedding with model '${config.gemini.embeddingModel}': ${error.message}`);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

export async function generateBatchEmbeddings(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const results = [];
  for (const text of texts) {
    const emb = await generateEmbedding(text);
    results.push(emb);
  }
  return results;
}
