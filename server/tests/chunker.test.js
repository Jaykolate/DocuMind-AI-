import { describe, it, expect } from 'vitest';
import { chunkDocument, splitTextIntoChunks } from '../src/services/textChunker.js';

describe('Text Chunker Service', () => {
  it('should split text into chunks respecting max size and overlap', () => {
    const text = 'Sentence one is here. Sentence two follows it. Sentence three is longer and contains more details. Sentence four concludes the thought.';
    const chunkSize = 50;
    const chunkOverlap = 15;

    const chunks = splitTextIntoChunks(text, chunkSize, chunkOverlap);
    expect(chunks.length).toBeGreaterThan(1);

    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(chunkSize + 20); // within delimiter search bounds
      expect(chunk.trim().length).toBeGreaterThan(0);
    }
  });

  it('should preserve page numbers across multi-page document input', () => {
    const pages = [
      { pageNumber: 1, text: 'This is page one text discussing the introduction and overview.' },
      { pageNumber: 2, text: 'This is page two text detailing the methodology and experiment setup.' },
      { pageNumber: 3, text: 'This is page three text giving the results and final conclusion.' }
    ];

    const chunks = chunkDocument(pages, {
      documentId: 'doc-123',
      filename: 'sample.pdf',
      chunkSize: 100,
      chunkOverlap: 20
    });

    expect(chunks.length).toBeGreaterThanOrEqual(3);

    const page1Chunks = chunks.filter(c => c.pageNumber === 1);
    const page2Chunks = chunks.filter(c => c.pageNumber === 2);
    const page3Chunks = chunks.filter(c => c.pageNumber === 3);

    expect(page1Chunks.length).toBeGreaterThan(0);
    expect(page2Chunks.length).toBeGreaterThan(0);
    expect(page3Chunks.length).toBeGreaterThan(0);

    // Verify metadata
    expect(chunks[0].documentId).toBe('doc-123');
    expect(chunks[0].filename).toBe('sample.pdf');
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[0].metadata).toBeDefined();
    expect(chunks[0].metadata.pageNumber).toBe(1);
  });

  it('should handle empty or whitespace-only inputs gracefully', () => {
    expect(chunkDocument('')).toEqual([]);
    expect(chunkDocument('   \n\n   ')).toEqual([]);
    expect(chunkDocument([])).toEqual([]);
    expect(chunkDocument([{ pageNumber: 1, text: '   ' }])).toEqual([]);
  });

  it('should handle plain string input with default page 1', () => {
    const chunks = chunkDocument('Simple single string content for testing.', {
      documentId: 'doc-str',
      filename: 'text.txt'
    });

    expect(chunks.length).toBe(1);
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[0].content).toContain('Simple single string content');
  });
});
