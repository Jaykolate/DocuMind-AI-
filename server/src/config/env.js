import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from workspace root or current directory
const candidateEnvPaths = [
  path.resolve(__dirname, '../../.env'),       // server/.env
  path.resolve(__dirname, '../../../.env'),    // root .env
  path.resolve(process.cwd(), '.env'),         // cwd .env
  path.resolve(process.cwd(), '../.env')       // parent of cwd
];

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Gemini settings - auto-support current active models
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    chatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash',
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
    dimensions: 768
  },

  // Qdrant settings
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY || '',
    collectionName: process.env.QDRANT_COLLECTION_NAME || 'DocuMind'
  },

  // RAG Pipeline settings
  rag: {
    chunkSize: parseInt(process.env.CHUNK_SIZE || '600', 10),
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '100', 10),
    topK: parseInt(process.env.TOP_K || '4', 10),
    scoreThreshold: parseFloat(process.env.SCORE_THRESHOLD || '0.15')
  },

  // Upload constraints
  upload: {
    maxFileSize: 25 * 1024 * 1024,
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ],
    allowedExtensions: ['.pdf', '.docx', '.doc']
  }
};
