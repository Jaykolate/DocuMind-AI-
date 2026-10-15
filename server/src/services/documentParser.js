import crypto from 'crypto';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { logger } from '../utils/logger.js';

/**
 * Calculates SHA-256 hash of a buffer for duplicate document detection.
 * @param {Buffer} buffer 
 * @returns {string} hex hash
 */
export function calculateBufferHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Parses uploaded document buffer into structured page texts.
 * 
 * @param {Object} file - Multer file object ({ originalname, mimetype, buffer, size })
 * @returns {Promise<{
 *   text: string,
 *   pages: Array<{ pageNumber: number, text: string }>,
 *   totalPages: number,
 *   fileHash: string,
 *   fileType: string
 * }>}
 */
export async function parseDocument(file) {
  if (!file || !file.buffer) {
    throw new Error('No file buffer provided for parsing.');
  }

  const filename = file.originalname || 'document';
  const extension = filename.split('.').pop()?.toLowerCase();
  const fileHash = calculateBufferHash(file.buffer);

  logger.info(`Parsing document '${filename}' (${file.size} bytes, hash: ${fileHash.slice(0, 8)}...)`);

  let extractedPages = [];
  let combinedText = '';

  if (extension === 'pdf' || file.mimetype === 'application/pdf') {
    try {
      const pageList = [];
      const pdfData = await pdfParse(file.buffer, {
        // Collect page text with page indices
        pager: function(pageData) {
          return pageData.getTextContent().then(function(textContent) {
            let pageText = '';
            for (const item of textContent.items) {
              pageText += item.str + (item.hasEOL ? '\n' : ' ');
            }
            pageList.push({
              pageNumber: pageList.length + 1,
              text: pageText.trim()
            });
            return pageText;
          });
        }
      });

      if (pageList.length > 0) {
        extractedPages = pageList;
        combinedText = pageList.map(p => p.text).join('\n\n');
      } else {
        // Fallback to parsed string if pager did not collect
        const raw = pdfData.text || '';
        const rawPages = raw.split(/\f|\x0C/).filter(p => p.trim().length > 0);
        if (rawPages.length > 0) {
          extractedPages = rawPages.map((pt, idx) => ({ pageNumber: idx + 1, text: pt.trim() }));
        } else {
          extractedPages = [{ pageNumber: 1, text: raw.trim() }];
        }
        combinedText = raw;
      }
    } catch (pdfErr) {
      logger.error(`Failed to parse PDF document '${filename}':`, pdfErr.message);
      throw new Error(`Failed to parse PDF document: ${pdfErr.message}`);
    }
  } else if (
    extension === 'docx' ||
    extension === 'doc' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      combinedText = (result.value || '').trim();

      // Split docx by page breaks or double linebreaks into virtual pages
      const rawSections = combinedText.split(/\n{3,}/).filter(s => s.trim().length > 0);
      if (rawSections.length > 1) {
        extractedPages = rawSections.map((sec, idx) => ({ pageNumber: idx + 1, text: sec.trim() }));
      } else {
        extractedPages = [{ pageNumber: 1, text: combinedText }];
      }
    } catch (docxErr) {
      logger.error(`Failed to parse DOCX document '${filename}':`, docxErr.message);
      throw new Error(`Failed to parse DOCX document: ${docxErr.message}`);
    }
  } else {
    throw new Error(`Unsupported document format '.${extension}'. Only PDF and DOCX documents are accepted.`);
  }

  // Validate that document contains readable text
  const cleanTotalText = combinedText.replace(/\s+/g, ' ').trim();
  if (!cleanTotalText || cleanTotalText.length < 5) {
    throw new Error(
      `Document '${filename}' does not contain any extractable text. Please ensure it is not an empty or scanned-image-only document.`
    );
  }

  logger.info(`Successfully parsed '${filename}': ${extractedPages.length} pages, ${cleanTotalText.length} characters.`);

  return {
    filename,
    fileType: extension,
    fileHash,
    fileSize: file.size,
    totalPages: extractedPages.length,
    pages: extractedPages,
    text: combinedText
  };
}
