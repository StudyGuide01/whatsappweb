import express from 'express';
import { logout, verifyOtp } from '../controller/user.controller.js';
import { sendOTP } from '../controller/user.controller.js';
const router = express.Router();


router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOtp);
router.get('/logout',logout);


export default router;