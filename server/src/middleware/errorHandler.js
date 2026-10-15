import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error(`Error processing request [${req.method} ${req.url}]:`, err.message);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File size exceeds 25 MB limit.',
        code: 'FILE_TOO_LARGE'
      });
    }
    return res.status(400).json({
      error: `Upload error: ${err.message}`,
      code: 'UPLOAD_ERROR'
    });
  }

  if (err.message && (err.message.includes('Invalid file type') || err.message.includes('Only PDF and DOCX'))) {
    return res.status(400).json({
      error: err.message,
      code: 'INVALID_FILE_TYPE'
    });
  }

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
