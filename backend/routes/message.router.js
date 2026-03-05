import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { sendMessage } from '../controller/chat.controller.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';
// import { sendMessage } from '../controller/chat.controller.js'

const router = express.Router();    


router.post('/send-message', authenticate, uploadSingle('file'), sendMessage);

export default router;