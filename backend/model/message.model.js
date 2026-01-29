import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
	conversation: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Conversation',
		required: true,
		index: true // Fast lookup for all messages in a chat
	},
	sender: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},

	// Generic content field
	content: { type: String, trim: true },

	// Improved Media Handling
	attachments: [
		{
			url: String,
			fileType: { type: String, enum: ['image', 'video', 'audio', 'file'] },
			publicId: String // Useful if using Cloudinary/S3 to delete files later
		}
	],

	messageType: {
		type: String,
		enum: ['text', 'media', 'system'], // 'system' for "X joined the group"
		default: 'text'
	},

	// Fixed Reactions syntax
	reactions: [
		{
			user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			emoji: String
		}
	],

	// Advanced Read Receipts
	// In a 1:1, if length > 0, it's read. In groups, we know exactly who.
	seenBy: [
		{
			user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			seenAt: { type: Date, default: Date.now }
		}
	],

	// For "Reply to" functionality
	replyTo: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Message',
		default: null
	},

	// Soft delete (Delete for everyone)
	isDeleted: { type: Boolean, default: false },

	// Track if message was edited
	isEdited: { type: Boolean, default: false }

}, { timestamps: true });

/** 
 * INDEXING: This is the most important part for performance.
 * This makes fetching the latest messages for a specific chat 
 * incredibly fast.
 */
messageSchema.index({ conversation: 1, createdAt: -1 });

const MessageModel = mongoose.model('Message', messageSchema);
export default MessageModel;



// import mongoose from "mongoose";

// const messageSchema = new mongoose.Schema({
// 	conversation: {
// 		type: mongoose.Schema.Types.ObjectId,
// 		ref: 'Conversation',
// 		required: true
// 	},
// 	sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
// 	receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
// 	content: { type: String },
// 	imageOrVideoUrl: { type: String },
// 	contentType: { type: String, enum: ['image', 'video', 'text'] },
// 	reactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
// 		emoji: { type: String }],
// 	messageStatus: { type: String, default: 'send' }
// }, { timestamps: true });

// const MessageModel = mongoose.model('Message', messageSchema);
// export default MessageModel;