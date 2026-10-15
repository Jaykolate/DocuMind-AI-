import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Backend API Endpoints', () => {
  it('GET /api/health should return system status and service health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.services).toBeDefined();
    expect(res.body.services.vectorStore).toBeDefined();
    expect(res.body.services.gemini).toBeDefined();
    expect(res.body.services.documentStore).toBeDefined();
  });

  it('GET /api/documents should return document list', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(200);
    expect(res.body.documents).toBeDefined();
    expect(Array.isArray(res.body.documents)).toBe(true);
  });

  it('POST /api/chat should validate empty question', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ question: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('POST /api/chat should accept valid question and return response structure', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        question: 'Is there any information on quantum computing?',
        topK: 2
      });
    expect(res.status).toBe(200);
    expect(res.body.answer).toBeDefined();
    expect(res.body.sources).toBeDefined();
    expect(res.body.metrics).toBeDefined();
  });

  it('POST /api/documents/upload should reject unsupported file extensions', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .attach('file', Buffer.from('console.log("hello")'), 'script.js');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Only PDF and DOCX files are supported');
  });

  it('POST /api/documents/compare should validate at least 2 document IDs', async () => {
    const res = await request(app)
      .post('/api/documents/compare')
      .send({
        documentIds: ['single-id'],
        focusTopic: 'architecture'
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});
