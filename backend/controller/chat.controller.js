import asyncHandler from 'express-async-handler';
import * as messageService from '../services/messageService.js';
import { response } from '../utils/responseHandler.js';
import ConversationModel from '../model/conversation.model.js';
import MessageModel from '../model/message.model.js';

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
            .select('lastMessage unreadCounts  updatedAt createdAt') 
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

            const myUnread = conv.unreadCounts.find(
              u => u.user._id.toString() === userId.toString()
            );
            
            const otherParticipant = conv.participants.find(
                (p) => p._id.toString() !== userId.toString()
            );

            

                // Remove the bulky participants array before sending to client
                const {unreadCounts, participants, ...rest } = conv;

                return {
                    ...rest,
                    participant: otherParticipant || null ,
                    unreadCount: myUnread?.count || 0
                };
            })
            // Optional: Filter out conversations that haven't started yet (no lastMessage)
            .filter(conv => conv.lastMessage !== null);

            console.log(formattedConversations);
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

//get messages for  a specific conversation

export const getMessage = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.userId;

    try {
        // 1. Conversation fetch
        const conversation = await ConversationModel.findById(conversationId);

        if (!conversation) {
            return response(res, 404, 'Conversation not found');
        }

        // 2. Authorization check (safe way)
        const isParticipant = conversation.participants.some(
            p => p.toString() === userId.toString()
        );

        if (!isParticipant) {
            return response(res, 403, 'Not authorized to view this conversation');
        }

        // 3. Get messages
        const messages = await MessageModel.find({ conversation: conversationId })
            .populate('sender', 'userName profile.picture')
            .populate('seenBy.user', 'userName profile.picture')
            .sort({ createdAt: 1 }) // oldest → newest
            .lean();

        // 4. Mark messages as read
        await MessageModel.updateMany(
            {
                conversation: conversationId,
                receiver: userId, 
                messageStatus: { $in: ['send', 'delivered'] }
            },
            {
                $set: { messageStatus: 'read' }
            }
        );

        // 5. Reset unread count for current user (optimized)
        await ConversationModel.updateOne(
            { _id: conversationId, "unreadCounts.user": userId },
            { $set: { "unreadCounts.$.count": 0 } }
        );

        // 6. Response
        return response(res, 200, 'Messages retrieved successfully', messages);

    } catch (error) {
        console.error(`[GetMessageError] Conversation: ${conversationId}`, error);

        return response(
            res,
            500,
            'An internal server error occurred while retrieving messages'
        );
    }
});

/* mark as read  */


/// ******************************* ISME ENSURE KANRA HE KE FROTNEND NE KONSE MESSAGE READ KARE FIR USKE HISAB SE INCREMENT DECREMENT KARNA HE COUNT ME =>>. YE BAD ME KARN AHE FREONTEND BANNE PAR

export const markAsRead = async (req, res) => {
    try {
        const { messageId } = req.body;
        const userId = req.userId;

        // 1. Get unread messages
        const messages = await MessageModel.find({
            _id: { $in: messageId },
            receiver: userId,
            messageStatus: { $ne: 'read' }
        });

        // 2. Mark as read
        await MessageModel.updateMany(
            { _id: { $in: messageId }, receiver: userId },
            { $set: { messageStatus: 'read' } }
        );

        // 3. Update unread count
        const readCount = messages.length;

        if (readCount > 0) {
            await ConversationModel.updateOne(
                { _id: messages[0].conversation, "unreadCounts.user": userId },
                { $inc: { "unreadCounts.$.count": -readCount } }
            );
        }

        return response(res, 200, "Messages marked as read", messages);

    } catch (error) {
        console.error('Error while marking messages read', error);
        return response(res, 500, 'Internal server error');
    }
};

export const  deleteMessag = async(req, res)=>{
    try {
        const {messageId} =  req.params;
        const userId = req.userId

        const message = await MessageModel.findById(messageId);
        if(!message){
            return response(res, 404, "message not found to delete ")
        }

        if(message.sender.toString() !== userId){
            return response(res, 403, 'not authorized to delete message');
        }
        
        await message.deleteOne();

        return response(res, 200, "Message deleted successfully");
    } catch (error) {
         console.error('Error while delete real message message ', error);
        return response(
            res,
            500,
            'An internal server error occurred while deleting  messages'
        );
    }
}