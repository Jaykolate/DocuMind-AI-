import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Splits text into overlapping chunks while preserving sentence/paragraph boundaries.
 * 
 * @param {Array<{pageNumber: number, text: string}> | string} input - Page-structured array or plain string
 * @param {Object} options - Chunking options
 * @param {number} options.chunkSize - Max characters per chunk (default 600)
 * @param {number} options.chunkOverlap - Overlap characters between chunks (default 100)
 * @param {string} options.documentId - Associated document ID
 * @param {string} options.filename - Associated filename
 * @returns {Array<Object>} List of chunk objects
 */
export function chunkDocument(input, options = {}) {
  const chunkSize = options.chunkSize || config.rag.chunkSize;
  const chunkOverlap = options.chunkOverlap || config.rag.chunkOverlap;
  const documentId = options.documentId || '';
  const filename = options.filename || 'unknown';

  if (!input) {
    return [];
  }

  // Normalize input into page list
  let pages = [];
  if (typeof input === 'string') {
    pages = [{ pageNumber: 1, text: input }];
  } else if (Array.isArray(input)) {
    pages = input;
  } else {
    throw new Error('Invalid input format for chunking. Expected string or page array.');
  }

  const allChunks = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const rawText = (page.text || '').trim();
    if (!rawText) continue;

    const pageNumber = page.pageNumber || 1;
    const pageChunks = splitTextIntoChunks(rawText, chunkSize, chunkOverlap);

    for (const chunkText of pageChunks) {
      if (chunkText.trim().length === 0) continue;

      allChunks.push({
        id: `${documentId}-chunk-${globalChunkIndex}`,
        documentId,
        filename,
        pageNumber,
        chunkIndex: globalChunkIndex,
        content: chunkText.trim(),
        metadata: {
          charCount: chunkText.length,
          wordCount: chunkText.split(/\s+/).filter(Boolean).length,
          pageNumber,
          chunkIndex: globalChunkIndex,
          filename,
          documentId
        }
      });

      globalChunkIndex++;
    }
  }

  logger.debug(`Chunked document '${filename}' into ${allChunks.length} chunks (chunkSize=${chunkSize}, overlap=${chunkOverlap})`);
  return allChunks;
}

/**
 * Split a continuous string of text into chunks of roughly `chunkSize` with `overlap`.
 * Prefers natural delimiters (paragraphs, sentences, punctuation, words).
 */
export function splitTextIntoChunks(text, chunkSize = 600, overlap = 100) {
  if (!text || text.length <= chunkSize) {
    return text ? [text.trim()] : [];
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex >= text.length) {
      const remainingChunk = text.slice(startIndex).trim();
      if (remainingChunk) chunks.push(remainingChunk);
      break;
    }

    // Look for a natural split point within the last 20% of the chunk window
    const searchWindowStart = Math.max(startIndex + Math.floor(chunkSize * 0.7), startIndex);
    const searchSubstring = text.slice(searchWindowStart, endIndex);

    const delimiters = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '];
    let splitOffset = -1;

    for (const delim of delimiters) {
      const lastPos = searchSubstring.lastIndexOf(delim);
      if (lastPos !== -1) {
        splitOffset = searchWindowStart + lastPos + delim.length;
        break;
      }
    }

    // Fallback: If no delimiter found, hard break at endIndex
    const finalSplitIndex = (splitOffset > startIndex) ? splitOffset : endIndex;
    const chunkContent = text.slice(startIndex, finalSplitIndex).trim();

    if (chunkContent) {
      chunks.push(chunkContent);
    }

    // Advance startIndex by chunk length minus overlap
    startIndex = Math.max(startIndex + 1, finalSplitIndex - overlap);
  }

  return chunks;
}
