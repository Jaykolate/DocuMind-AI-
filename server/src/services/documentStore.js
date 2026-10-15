import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'documents.json');

class DocumentStore {
  constructor() {
    this.documents = new Map();
    this.chunksByDoc = new Map();
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.documents)) {
          for (const doc of data.documents) {
            this.documents.set(doc.id, doc);
          }
        }
        if (data.chunks && typeof data.chunks === 'object') {
          for (const [docId, chunks] of Object.entries(data.chunks)) {
            this.chunksByDoc.set(docId, chunks);
          }
        }
        logger.info(`Loaded ${this.documents.size} documents from local storage.`);
      }
    } catch (e) {
      logger.warn(`Could not load existing store from disk: ${e.message}`);
    }
  }

  saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = {
        documents: Array.from(this.documents.values()),
        chunks: Object.fromEntries(this.chunksByDoc)
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      logger.error(`Failed to persist documents to disk: ${e.message}`);
    }
  }

  getAll() {
    return Array.from(this.documents.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getById(id) {
    const doc = this.documents.get(id);
    if (!doc) return null;
    const chunks = this.chunksByDoc.get(id) || [];
    return {
      ...doc,
      chunks
    };
  }

  findByHash(hash) {
    if (!hash) return null;
    for (const doc of this.documents.values()) {
      if (doc.fileHash === hash) {
        return doc;
      }
    }
    return null;
  }

  create({ filename, fileType, fileSize, totalPages, fileHash, chunkCount = 0 }) {
    const id = uuidv4();
    const doc = {
      id,
      filename,
      fileType,
      fileSize,
      totalPages,
      fileHash,
      chunkCount,
      status: 'processing',
      createdAt: new Date().toISOString()
    };
    this.documents.set(id, doc);
    this.saveToDisk();
    logger.info(`Created document entry: ${filename} (id=${id})`);
    return doc;
  }

  update(id, updates) {
    const existing = this.documents.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.documents.set(id, updated);
    this.saveToDisk();
    return updated;
  }

  saveChunks(docId, chunks) {
    this.chunksByDoc.set(docId, chunks);
    this.saveToDisk();
  }

  delete(id) {
    const existed = this.documents.delete(id);
    this.chunksByDoc.delete(id);
    this.saveToDisk();
    if (existed) {
      logger.info(`Removed document ${id} from document store.`);
    }
    return existed;
  }

  clear() {
    this.documents.clear();
    this.chunksByDoc.clear();
    this.saveToDisk();
  }
}

export const documentStore = new DocumentStore();
