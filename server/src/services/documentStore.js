import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

class DocumentStore {
  constructor() {
    this.documents = new Map(); // id -> docMetadata
    this.chunksByDoc = new Map(); // docId -> Array<chunk>
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
    logger.info(`Created document entry: ${filename} (id=${id})`);
    return doc;
  }

  update(id, updates) {
    const existing = this.documents.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.documents.set(id, updated);
    return updated;
  }

  saveChunks(docId, chunks) {
    this.chunksByDoc.set(docId, chunks);
  }

  delete(id) {
    const existed = this.documents.delete(id);
    this.chunksByDoc.delete(id);
    if (existed) {
      logger.info(`Removed document ${id} from document store.`);
    }
    return existed;
  }

  clear() {
    this.documents.clear();
    this.chunksByDoc.clear();
  }
}

export const documentStore = new DocumentStore();
