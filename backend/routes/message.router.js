import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { sendMessage } from '../controller/chat.controller.js';
// import { sendMessage } from '../controller/chat.controller.js'

const router = express.Router();


router.post('/send-message', authenticate, sendMessage)

export default router;