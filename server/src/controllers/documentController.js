import { parseDocument } from '../services/documentParser.js';
import { chunkDocument } from '../services/textChunker.js';
import { generateBatchEmbeddings } from '../services/embeddingService.js';
import { vectorStore } from '../services/vectorStore.js';
import { documentStore } from '../services/documentStore.js';
import { logger } from '../utils/logger.js';

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded. Please upload a PDF or DOCX file.' });
    }

    const { originalname, size, mimetype } = req.file;
    logger.info(`Incoming document upload: ${originalname} (${size} bytes)`);

    // 1. Parse document text & structure
    const parsed = await parseDocument(req.file);

    // 2. Prevent duplicate ingestion if exact same file hash exists
    const duplicateDoc = documentStore.findByHash(parsed.fileHash);
    if (duplicateDoc && duplicateDoc.status === 'indexed') {
      return res.status(409).json({
        error: `Document '${originalname}' is already indexed.`,
        document: duplicateDoc,
        isDuplicate: true
      });
    }

    // 3. Create document record
    const docRecord = documentStore.create({
      filename: parsed.filename,
      fileType: parsed.fileType,
      fileSize: parsed.fileSize,
      totalPages: parsed.totalPages,
      fileHash: parsed.fileHash
    });

    try {
      // 4. Chunk document text
      const chunks = chunkDocument(parsed.pages, {
        documentId: docRecord.id,
        filename: parsed.filename
      });

      if (chunks.length === 0) {
        throw new Error('No valid chunks could be created from the document content.');
      }

      // 5. Generate embeddings for all chunks
      const chunkTexts = chunks.map(c => c.content);
      const embeddings = await generateBatchEmbeddings(chunkTexts);

      const chunksWithEmbeddings = chunks.map((chunk, idx) => ({
        ...chunk,
        embedding: embeddings[idx]
      }));

      // 6. Store vectors in Qdrant / VectorStore
      await vectorStore.upsertChunks(chunksWithEmbeddings);

      // Save chunks to documentStore for inspection
      documentStore.saveChunks(docRecord.id, chunks);

      // 7. Update status to indexed
      const updatedDoc = documentStore.update(docRecord.id, {
        status: 'indexed',
        chunkCount: chunks.length
      });

      logger.info(`Successfully ingested & indexed '${originalname}' (${chunks.length} chunks)`);

      return res.status(201).json({
        message: 'Document successfully uploaded and indexed.',
        document: updatedDoc,
        chunkCount: chunks.length
      });
    } catch (ingestError) {
      documentStore.update(docRecord.id, {
        status: 'error',
        errorMessage: ingestError.message
      });
      throw ingestError;
    }
  } catch (error) {
    next(error);
  }
}

export function getDocuments(req, res) {
  const documents = documentStore.getAll();
  res.json({
    total: documents.length,
    documents
  });
}

export function getDocumentById(req, res) {
  const { id } = req.params;
  const document = documentStore.getById(id);

  if (!document) {
    return res.status(404).json({ error: `Document with ID '${id}' not found.` });
  }

  res.json({ document });
}

export async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params;
    const document = documentStore.getById(id);

    if (!document) {
      return res.status(404).json({ error: `Document with ID '${id}' not found.` });
    }

    // Delete vectors from Qdrant/vectorStore
    const vectorResult = await vectorStore.deleteByDocumentId(id);

    // Delete from metadata store
    documentStore.delete(id);

    logger.info(`Deleted document ${id} (${document.filename}) and associated vectors.`);

    res.json({
      message: `Document '${document.filename}' and all associated vectors deleted successfully.`,
      vectorDeletion: vectorResult
    });
  } catch (error) {
    next(error);
  }
}
