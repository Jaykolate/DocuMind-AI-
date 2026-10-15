import express from 'express';
import cors from 'cors';
import documentRoutes from './routes/documentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import toolsRoutes from './routes/toolsRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security and middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/documents', toolsRoutes); // handles /:id/summarize, /compare, /search
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/health', healthRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'NexusRAG Backend API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      upload: 'POST /api/documents/upload',
      documents: 'GET /api/documents',
      documentById: 'GET /api/documents/:id',
      deleteDocument: 'DELETE /api/documents/:id',
      chat: 'POST /api/chat',
      summarize: 'POST /api/documents/:id/summarize',
      compare: 'POST /api/documents/compare',
      search: 'POST /api/documents/search'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use(errorHandler);

export default app;
