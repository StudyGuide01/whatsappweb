import express from 'express';
import { checkAuthenticate, logout, verifyOtp } from '../controller/user.controller.js';
import { sendOTP } from '../controller/user.controller.js';
import { authenticate } from '../middlewares/authMiddleware.js';
const router = express.Router();


router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOtp);
router.get('/logout',logout);
router.get('/check-auth',authenticate,checkAuthenticate);


export default router;