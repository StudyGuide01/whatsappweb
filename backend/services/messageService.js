import { response } from "../utils/responseHandler.js";

export const senderService = async (data, file) => {
	try {

		const participants = [data.senderId, data.receiverId].sort();
		return [
			{ message: 'Data gotted', participants: participants }
		];

	} catch (error) {
		console.log('Message service error while send message', error);
		throw error;
	}
};
