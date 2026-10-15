import { Router } from 'express';
import { validateBody, chatSchema } from '../middleware/validator.js';
import { chat } from '../controllers/chatController.js';

const router = Router();

router.post('/', validateBody(chatSchema), chat);

export default router;
