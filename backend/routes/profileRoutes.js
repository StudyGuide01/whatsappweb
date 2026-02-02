import express from 'express';
// import { updateProfile, getProfile } from '../controllers/profileController.js';
// import { authenticate } from '../middlewares/authMiddleware.js';
// import { uploadSingle } from '../middlewares/uploadMiddleware.js';
import { updateProfile } from '../controller/user.controller.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply authentication to all profile routes
router.use(authenticate);

// Get user profile


// Update profile with optional file upload
router.patch(
  '/update',
  uploadSingle('profilePicture'), // 'profilePicture' is the field name
  updateProfile);

// // Delete profile picture
// router.delete('/picture', asyncHandler(async (req, res) => {
//   // Implementation for deleting profile picture
// }));

export default router;