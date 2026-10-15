import { Router } from 'express';
import { validateBody, summarizeSchema, compareSchema, searchSchema } from '../middleware/validator.js';
import { summarize, compare, search } from '../controllers/toolsController.js';

const router = Router();

router.post('/:id/summarize', validateBody(summarizeSchema), summarize);
router.post('/compare', validateBody(compareSchema), compare);
router.post('/search', validateBody(searchSchema), search);

export default router;
