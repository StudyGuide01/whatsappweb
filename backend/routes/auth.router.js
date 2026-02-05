import express from 'express';
import { checkAuthenticat, getAllUsers, logout, verifyOtp } from '../controller/user.controller.js';
import { sendOTP } from '../controller/user.controller.js';
import { authenticate } from '../middlewares/authMiddleware.js';
const router = express.Router();


router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOtp);
router.get('/logout', logout);
router.get('/check-auth', authenticate, checkAuthenticat);
router.get('/get-allUser', authenticate, getAllUsers);

export default router;