import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
	// Distinguish between 1:1 and Groups
	isGroup: { type: Boolean, default: false },
	groupName: { type: String, trim: true },
	groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

	// Indexed for fast querying
	participants: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		index: true
	}],

	// Track unread counts per user
	// Example: [{ user: 'id1', count: 5 }, { user: 'id2', count: 0 }]
	unreadCounts: [
		{
			user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			count: { type: Number, default: 0 }
		}
	],

	// Denormalized for high-performance UI rendering
	// This prevents having to "populate" messages just to show the chat list
	lastMessage: {
		text: String,
		sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		createdAt: Date,
		messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
	},

}, {
	timestamps: true,
	// Ensure we don't send __v to the frontend
	toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; return ret; } }
});

// Optimization: Compound index for finding a DM between exactly two users quickly
conversationSchema.index({ participants: 1, isGroup: 1 });

const ConversationModel = mongoose.model('Conversation', conversationSchema);
export default ConversationModel;



// import mongoose from "mongoose";


// const conversationSchema = new mongoose.Schema({
// 	participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
// 	lastMessage: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
// 	unreadCount: { type: Number, default: 0 }
// }, { timestamps: true });

// const ConversationModel = mongoose.model('Conversation', conversationSchema);
// export default ConversationModel;