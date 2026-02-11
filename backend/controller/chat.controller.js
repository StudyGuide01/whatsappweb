import asyncHandler from 'express-async-handler';
import * as messageService from '../services/messageService.js';
import { response } from '../utils/responseHandler.js';

// send message 

export const sendMessage = asyncHandler(async (req, res) => {
	try {
		const { senderId, receiverId, content } = req.body;
		const file = req.file;

		if (!senderId || !receiverId) {
			return response(res, 400, 'Sender and receiver are required');
		}


		if (!content && !file) {
			return response(res, 400, 'Either content or file is required');
		}


		const data = {
			senderId,
			receiverId,
			content: content || ''
		};

		const result = await messageService.senderService(data, file);

		return response(res, 201, 'Message sent successfully', result);

	} catch (error) {
		console.log('Message Controller While send message', error);
		return response(res, 500, 'Internal server error');
	}
});
