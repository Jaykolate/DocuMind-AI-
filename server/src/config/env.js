import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or server folder
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Gemini settings
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    chatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash',
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
    dimensions: 768 // text-embedding-004 outputs 768 dimensions
  },

  // Qdrant settings
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY || '',
    collectionName: process.env.QDRANT_COLLECTION_NAME || 'nexusrag_documents'
  },

  // RAG Pipeline settings
  rag: {
    chunkSize: parseInt(process.env.CHUNK_SIZE || '600', 10),
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '100', 10),
    topK: parseInt(process.env.TOP_K || '4', 10),
    scoreThreshold: parseFloat(process.env.SCORE_THRESHOLD || '0.35')
  },

  // Upload constraints
  upload: {
    maxFileSize: 25 * 1024 * 1024, // 25 MB
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ],
    allowedExtensions: ['.pdf', '.docx', '.doc']
  }
};
