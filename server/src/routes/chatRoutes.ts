import { Router } from 'express';
import {
  findOrCreateChat,
  createGroupChat,
  getUserChats,
  getChatMessages,
  sendMessage,
} from '../controllers/chatController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Protect all chat & message routes with authMiddleware
router.use(authMiddleware);

router.post('/group', createGroupChat);
router.post('/', findOrCreateChat);
router.get('/', getUserChats);
router.get('/:chatId/messages', getChatMessages);
router.post('/:chatId/messages', sendMessage);

export default router;
