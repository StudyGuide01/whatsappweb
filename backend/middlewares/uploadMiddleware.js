import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileTypeFromBuffer } from 'file-type';
import { logger } from '../utils/logger.js';

// Create uploads directory if it doesn't exist
const ensureUploadsDir = async () => {
	const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
	try {
		await fs.access(uploadDir);
	} catch {
		await fs.mkdir(uploadDir, { recursive: true });
	}
	return uploadDir;
};

// Configure storage
const storage = multer.diskStorage({
	destination: async (req, file, cb) => {
		const uploadDir = await ensureUploadsDir();
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		const ext = path.extname(file.originalname);
		cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
	}
});

// File validation
const fileFilter = (req, file, cb) => {
	const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
	const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
	const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error('Invalid file type. Only images and videos are allowed'), false);
	}
};

// Create multer instance
const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
		files: 1 // Only one file
	}
});

// Enhanced file validation middleware
export const validateUpload = async (req, res, next) => {
	if (!req.file) {
		return next(); // No file to validate
	}

	try {
		// Read file for additional validation
		const fileBuffer = await fs.readFile(req.file.path);
		const fileType = await fileTypeFromBuffer(fileBuffer);

		if (!fileType) {
			throw new Error('Could not determine file type');
		}

		// Additional security checks
		const isImage = fileType.mime.startsWith('image/');
		const isVideo = fileType.mime.startsWith('video/');

		if (!isImage && !isVideo) {
			throw new Error('File is not a valid image or video');
		}

		// Add file type to request for later use
		req.file.actualMimeType = fileType.mime;

		logger.info(`File validated: ${req.file.originalname}, Type: ${fileType.mime}`);
		next();
	} catch (error) {
		// Clean up the uploaded file if validation fails
		await fs.unlink(req.file.path).catch(() => { });
		next(error);
	}
};

// Cleanup middleware to remove temp files after response
export const cleanupTempFiles = async (req, res, next) => {
	const originalSend = res.send;

	res.send = function (data) {
		// Clean up after response is sent
		if (req.file) {
			fs.unlink(req.file.path).catch(err => {
				logger.error('Failed to delete temp file:', err);
			});
		}
		originalSend.call(this, data);
	};

	next();
};

export const uploadSingle = (fieldName) => [
	upload.single(fieldName),
	validateUpload,
	cleanupTempFiles
];