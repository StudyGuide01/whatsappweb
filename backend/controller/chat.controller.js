import asyncHandler from 'express-async-handler';
import * as messageService from '../services/messageService.js';
import { response } from '../utils/responseHandler.js';

// send message 

export const sendMessage = asyncHandler(async (req, res) => {
	try {
		const { senderId, receiverId, content, messageStatus } = req.body;
		const file = req.file;

		if (!senderId || !receiverId || !content || !messageStatus) {
			return response(res, 400, 'Required feild are missing');
		}
		const data = {
			senderId,
			receiverId,
			content,
			messageStatus
		};

		const result = await messageService.senderService(data, file);

		console.log(result);

	} catch (error) {
		console.log('Message Controller While send message', error);
		return response(res, 500, 'Internal server error');
	}
});
