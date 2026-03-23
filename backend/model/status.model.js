import mongoose from "mongoose";

const statusSchema = new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
	content: { type: String, trim: true },
    messageType: {
		type: String,
		enum: ['text', 'media', 'system'], 
		default: 'text'
	},
    viewers:[{type:mongoose.Schema.Types.ObjectId, ref:'User'}],
    expiresAt:{type:Date, required:true}
},{timestamps:true});

const StatusModel = mongoose.model('Status', statusSchema);
export default StatusModel;