import asyncHandler from 'express-async-handler';
import * as messageService from '../services/messageService.js';
import { response } from '../utils/responseHandler.js';
import ConversationModel from '../model/conversation.model.js';

// send message 

export const sendMessage = asyncHandler(async (req, res) => {
	try {
		const { senderId, receiverId, content, messageStatus } = req.body;
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


export const getAllConversation = asyncHandler(async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        return response(res, 400, 'User ID is required');
    }

    try {
        const conversations = await ConversationModel
            .find({ participants: userId })
            // Limit fields for performance and security
            .select('lastMessage updatedAt createdAt') 
            .populate({
                path: 'participants',
                select: 'userName profile.picture presence.isOnline presence.lastSeen'
            })
            .populate({
                path: 'lastMessage',
                // select: 'text fileType createdAt sender receiver', 
                populate: {
                    path: 'sender receiver',
                    select: 'userName profile.picture'
                }
            })
            .sort({ updatedAt: -1 })
            .lean();

        // Transform data: Extract "the other person" and cleanup payload
        const formattedConversations = conversations
            .map((conv) => {
                const otherParticipant = conv.participants.find(
                    (p) => p._id.toString() !== userId.toString()
                );

                // Remove the bulky participants array before sending to client
                const { participants, ...rest } = conv;

                return {
                    ...rest,
                    participant: otherParticipant || null 
                };
            })
            // Optional: Filter out conversations that haven't started yet (no lastMessage)
            .filter(conv => conv.lastMessage !== null);

        return response(
            res,
            200,
            'Conversations fetched successfully',
            formattedConversations
        );

    } catch (error) {
        // Log stack trace only in development, use a logger (like Winston) in production
        console.error(`[ConversationError] User: ${userId} -`, error);

        return response(
            res,
            500,
            'An internal server error occurred while retrieving conversations'
        );
    }
});