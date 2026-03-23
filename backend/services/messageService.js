import ConversationModel from "../model/conversation.model.js";
import cloudinaryService from '../services/cloudinaryService.js';
import MessageModel from "../model/message.model.js";
import mongoose from "mongoose";



export const senderService = async (data, file) => {
	try {
		const { senderId, receiverId, content } = data;

		
		// 1. Conversation find ya create
		let conversation = await ConversationModel.findOne({
			participants: { $all: [senderId, receiverId] },
			isGroup: false
		});

		if (!conversation) {
			conversation = new ConversationModel({
				participants: [senderId, receiverId],
				isGroup: false,
				unreadCounts: [
					{ user: senderId, count: 0 },
					{ user: receiverId, count: 1 }
				]
			});
			await conversation.save();
		} else {
			const receiverUnreadIndex = conversation.unreadCounts.findIndex(
				u => u.user.toString() === receiverId.toString()
			);

			if (receiverUnreadIndex !== -1) {
				conversation.unreadCounts[receiverUnreadIndex].count += 1;
			} else {
				conversation.unreadCounts.push({ user: receiverId, count: 1 });
			}
		}

		// 2. Message type aur attachments handle karo
		let messageType = 'text';
		let attachments = [];

		if (file) {
			const uploadFile = await cloudinaryService.uploadContentFile(file.path);

		if (!uploadFile?.url) {
             throw new Error('Failed to upload media');
        }

			// File type detect karo
			let fileType = 'file';
			if (file.mimetype?.startsWith('image/')) {
				fileType = 'image';
				messageType = 'media';
			} else if (file.mimetype?.startsWith('video/')) {
				fileType = 'video';
				messageType = 'media';
			} else if (file.mimetype?.startsWith('audio/')) {
				fileType = 'audio';
				messageType = 'media';
			}

	

			attachments.push({
  url: uploadFile.url,
  fileType: fileType,
  publicId: uploadFile.publicId || null
});
		}

		// 3. Message create karo
		const message = new MessageModel({
			conversation: conversation._id,
			sender: senderId,
			content: content || '',
			messageStatus:'send',
			messageType: messageType,
			attachments: attachments,
			seenBy: [], 
			isDeleted: false,
			isEdited: false
		});

		await message.save();

		// 4. Conversation update karo - lastMessage
		conversation.lastMessage = {
			text: content || (file ? '📸 Media' : ''),
			sender: senderId,
			receiver: receiverId,
			createdAt: new Date(),
			messageId: message._id
		};

		await conversation.save();

		// 5. Populated message return karo
		const populatedMessage = await MessageModel.findById(message._id)
			.populate('sender', 'userName profile.picture')
			.populate('seenBy.user', 'userName profile.picture')
			.populate('replyTo')
			.lean();

		return populatedMessage;





	} catch (error) {
		console.log('Message service error while send message', error);
		throw error;
	}
};
