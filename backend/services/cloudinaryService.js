import cloudinary from '../config/cloudinaryConfig.js';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';

class CloudinaryService {
	constructor() {
		this.cloudinary = cloudinary;
	}

	async uploadFile(filePath, options = {}) {
		try {
			const defaultOptions = {
				folder: 'user-profiles',
				use_filename: true,
				unique_filename: true,
				overwrite: false,
				resource_type: 'auto',
				transformation: [
					{ width: 500, height: 500, crop: 'limit' },
					{ quality: 'auto:good' }
				]
			};

			const uploadOptions = { ...defaultOptions, ...options };

			// Determine resource type based on file extension
			const ext = path.extname(filePath).toLowerCase();
			if (['.mp4', '.webm', '.ogg', '.mov'].includes(ext)) {
				uploadOptions.resource_type = 'video';
				uploadOptions.transformation = [{ quality: 'auto:good' }];
			}

			logger.info(`Uploading file to Cloudinary: ${filePath}`);

			const result = await this.cloudinary.uploader.upload(filePath, uploadOptions);

			logger.info(`File uploaded successfully: ${result.public_id}`);

			return {
				url: result.secure_url,
				publicId: result.public_id,
				format: result.format,
				bytes: result.bytes,
				width: result.width,
				height: result.height,
				resourceType: result.resource_type
			};
		} catch (error) {
			logger.error('Cloudinary upload error:', error);
			throw new Error(`Failed to upload file: ${error.message}`);
		}
	}

	async uploadFromBuffer(buffer, originalName, options = {}) {
		try {
			const tempFilePath = path.join(process.cwd(), 'uploads', 'temp', `temp-${Date.now()}-${originalName}`);

			await fs.writeFile(tempFilePath, buffer);
			const result = await this.uploadFile(tempFilePath, options);

			// Cleanup temp file
			await fs.unlink(tempFilePath);

			return result;
		} catch (error) {
			logger.error('Cloudinary upload from buffer error:', error);
			throw error;
		}
	}

	async deleteFile(publicId, resourceType = 'image') {
		try {
			const result = await this.cloudinary.uploader.destroy(publicId, {
				resource_type: resourceType,
				invalidate: true
			});

			if (result.result === 'ok') {
				logger.info(`File deleted from Cloudinary: ${publicId}`);
				return true;
			} else {
				throw new Error(`Failed to delete file: ${result.result}`);
			}
		} catch (error) {
			logger.error('Cloudinary delete error:', error);
			throw new Error(`Failed to delete file: ${error.message}`);
		}
	}
}

export default new CloudinaryService();