import {asyncHandler } from 'express-async-handler';
import cloudinaryService from '../services/cloudinaryService.js';
import StatusModel from '../model/status.model.js';
import { response } from '../utils/responseHandler.js';


export const statusCreateService = asyncHandler(async(data, file)=>{
    try {
        const {content, messageType, userId} = data;
         let finalMessageType = messageType || 'text';

     if (file) {
          const uploadFile = await cloudinaryService.uploadStatusFile(file.path);
        
          if (!uploadFile?.url) {
               throw new Error('Failed to upload media');
          }
        
          let fileType = 'file';

          if (file.mimetype?.startsWith('image/')) {
               finalMessageType = 'media';
          } else if (file.mimetype?.startsWith('video/')) {
               finalMessageType = 'media';
          } else if (file.mimetype?.startsWith('audio/')) {
               finalMessageType = 'media';
          }

          content = uploadFile.url;
     }

     let expiresAt = new Date();
     expiresAt.setHours(expiresAt.getHours() + 24);

     const status = new StatusModel({
          user: userId,
          content: content,
          messageType: finalMessageType,
          messageStatus: 'create'
     });

     const populateStatus = await StatusModel.findOne(status?._id)
     .populate('user', 'userName profile.picture')
     .populate('viewers', 'userName profile.picture').lean();

     return populateStatus;

     

    } catch (error) {
        	console.log('Message service error while create status ', error);
		throw error;
    }
})