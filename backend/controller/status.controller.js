import {asyncHandler } from 'express-async-handler';
import statusService from '../services/status.service.js'
import { response } from '../utils/responseHandler.js';

export const createStatus = asyncHandler(async(req, res)=>{
    try {
        const {content, messageType} = req.body;
        const userId = req.userId;
        const file = req.file;

        const data = {
            content,
            messageType,
            userId
        }

        const result = await statusService.statusCreateService(data, file);
        return response(res, 201, 'Status Create Successfully', result);


    } catch (error) {
        console.log('Message Controller While create status', error);
		return response(res, 500, 'Internal server error');
    }
})