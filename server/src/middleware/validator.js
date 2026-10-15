import { z } from 'zod';

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(err);
    }
  };
}

// Schemas
export const chatSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty').max(2000, 'Question too long'),
  documentId: z.string().optional().nullable(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string()
    })
  ).optional().default([]),
  topK: z.number().int().min(1).max(20).optional(),
  scoreThreshold: z.number().min(0).max(1).optional()
});

export const summarizeSchema = z.object({
  style: z.enum(['brief', 'detailed', 'bullets']).optional().default('detailed')
});

export const compareSchema = z.object({
  documentIds: z.array(z.string().min(1)).min(2, 'At least 2 documents are required for comparison'),
  focusTopic: z.string().optional().default('general comparison')
});

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
  documentId: z.string().optional().nullable(),
  topK: z.number().int().min(1).max(30).optional().default(6),
  scoreThreshold: z.number().min(0).max(1).optional().default(0.25)
});
