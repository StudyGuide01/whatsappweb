import express from 'express';
import { updateProfile } from '../controller/user.controller.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply authentication to all profile routes
router.use(authenticate);



// Update profile with optional file upload
router.patch(
	'/update',
	uploadSingle('profilePicture'),
	updateProfile);

// // Delete profile picture
// router.delete('/picture', asyncHandler(async (req, res) => {
//   // Implementation for deleting profile picture
// }));

export default router;