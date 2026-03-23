import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { deleteMessag, getAllConversation, getMessage, markAsRead, sendMessage } from '../controller/chat.controller.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';
// import { sendMessage } from '../controller/chat.controller.js'

const router = express.Router();    


router.post('/send-message', authenticate, uploadSingle('file'), sendMessage);
router.get('/getAllConversation', authenticate, getAllConversation);
router.get('/get-message/:conversationId', authenticate, getMessage);
router.put('/mark-read', authenticate, markAsRead);
router.delete('/delete-message/:messageId',authenticate, deleteMessag);

export default router;