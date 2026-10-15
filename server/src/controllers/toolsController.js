import { documentStore } from '../services/documentStore.js';
import { summarizeDocument, compareDocuments, searchDocuments } from '../services/toolsService.js';

export async function summarize(req, res, next) {
  try {
    const { id } = req.params;
    const { style = 'detailed' } = req.body;

    const doc = documentStore.getById(id);
    if (!doc) {
      return res.status(404).json({ error: `Document '${id}' not found.` });
    }

    const summary = await summarizeDocument({
      documentId: id,
      style,
      documentRecord: doc
    });

    res.json(summary);
  } catch (error) {
    next(error);
  }
}

export async function compare(req, res, next) {
  try {
    const { documentIds, focusTopic = 'general comparison' } = req.body;

    const documentMap = {};
    for (const docId of documentIds) {
      const doc = documentStore.getById(docId);
      if (doc) {
        documentMap[docId] = doc;
      }
    }

    const comparison = await compareDocuments({
      documentIds,
      focusTopic,
      documentMap
    });

    res.json(comparison);
  } catch (error) {
    next(error);
  }
}

export async function search(req, res, next) {
  try {
    const { query, documentId, topK, scoreThreshold } = req.body;

    const results = await searchDocuments({
      query,
      documentId,
      topK,
      scoreThreshold
    });

    res.json(results);
  } catch (error) {
    next(error);
  }
}
