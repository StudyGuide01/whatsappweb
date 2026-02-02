import { response } from "../utils/responseHandler.js";
import * as AuthService from '../services/auth.service.js';
import { generateToken } from '../utils/generateToken.js';
import UserModel from "../model/user.model.js";

// send otp
// export const sentOTP = async (req, res) => {
// 	const { phoneNumber, countryCode, email } = req.body;

// 	const otp = otpGenerater();
// 	const expiry = new Date(Date.now() + 5 * 60 * 1000);
// 	let user;

// 	try {
// 		if (email) {
// 			user = await UserModel.findOne({ email });

// 			if (!user) {
// 				user = new UserModel({ email });
// 			}
// 			user.auth.otp = otp;
// 			user.auth.otpExpiry = expiry;
// 			await user.save();

// 			//send otp to mail
// 			await sentOtpToMail(email, otp);

// 			return response(res, 200, 'OTP send on your email to login', { email });
// 		}

// 		if (!phoneNumber || !countryCode) {
// 			return response(res, 400, 'phone number and country code must required');
// 		}

// 		const fullPhoneNumber = `${countryCode}${phoneNumber}`;
// 		user = await UserModel.findOne({ phoneNumber });
// 		if (!user) {
// 			user = new UserModel({ phoneNumber, countryCode });
// 		}
// 		await user.save();
// 		await sendOtpToPhoneNumber(fullPhoneNumber);

// 		return response(res, 200, 'otp send on your phone successfully', user);
// 	} catch (error) {
// 		console.log(error);
// 		return response(res, 500, 'Internal server error');

// 	}

// }


export const sendOTP = async (req, res) => {
	try {
		const { email, phoneNumber, countryCode } = req.body;

		if (!email && (!phoneNumber || !countryCode)) {
			return response(res, 400, 'Please provide either an Email or Phone Number with Country Code.');
		}

		const result = await AuthService.handleLoginOtp({ email, phoneNumber, countryCode });

		return response(res, 200, result.message, result.data);

	} catch (error) {
		console.error('OTP Controller Error:', error);
		const status = error.statusCode || 500;
		return response(res, status, error.message || 'Internal Server Error');
	}
};


//verify otp

export const verifyOtp = async (req, res) => {
	try {
		const { email, phoneNumber, countryCode, otp } = req.body;

		if (!otp) { return response(res, 400, 'OTP is required'); }

		if (!email && (!phoneNumber || !countryCode)) { return response(res, 400, 'Email or Phone Number is required'); }

		const user = await AuthService.verifyUserOtp({ email, phoneNumber, countryCode, otp });


		const token = generateToken(user._id);


		const isProduction = process.env.NODE_ENV === 'production';

		res.cookie('auth_token', token, {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? 'strict' : 'lax',
			maxAge: 24 * 60 * 60 * 1000 * 365
		});


		const userResponse = {
			_id: user._id,
			email: user.email,
			phoneNumber: user.phoneNumber,
			isVerified: user.auth.isVerified
		};

		return response(res, 200, 'Login successful', userResponse);

	} catch (error) {
		console.error('Verify OTP Error:', error);
		const status = error.statusCode || 500;
		return response(res, status, error.message || 'Internal Server Error');
	}
};



import asyncHandler from 'express-async-handler';
// import UserModel from '../models/User.js';
import cloudinaryService from '../services/cloudinaryService.js';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse 
} from '../utils/responseHandler.js';
import { validateProfileUpdate } from '../utils/validators/profileValidator.js';
import { logger } from '../utils/logger.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.userId;


  // Validate input
  const { error, value: validatedData } = validateProfileUpdate(req.body);

  
  if (error) {
    logger.warn('Profile update validation failed', { userId, errors: error.details });
    return validationErrorResponse(res, error.details);
  }

  try {

    const user = await UserModel.findById(userId).select('-password');

    if (!user) {
      logger.warn(`User not found for profile update: ${userId}`);
      return errorResponse(res, 'User not found', 404, 'USER_NOT_FOUND');
    }

    let profilePictureData = null;
    const oldProfilePicture = user.profile?.picture; 
    const oldPublicId = user.profile?.filePublicId; 



    // Handle file upload if present
 if (req.file) {
  try {
    logger.info(`Processing file upload for user: ${userId}`);

    
    profilePictureData = await cloudinaryService.uploadFile(req.file.path, {
      folder: `user-profiles/${userId}`,
      public_id: `profile-${Date.now()}`,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:best' }
      ]
    });


    const oldPublicId = user.profile?.filePublicId; 

    
    if (oldPublicId) {
      await cloudinaryService.deleteFile(oldPublicId)
        .catch(err => logger.error('Failed to delete old profile picture:', err));
    }

  } catch (uploadError) {
    console.log(uploadError);
    logger.error('File upload failed:', { userId, error: uploadError.message });
    throw new Error(`Failed to upload profile picture: ${uploadError.message}`);
  }
}

    const updateFields = {};
    if (validatedData.userName) {
      const existingUser = await UserModel.findOne({ 
        userName: validatedData.userName, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return errorResponse(res, 'Username already taken', 409, 'USERNAME_EXISTS');
      }
      updateFields.userName = validatedData.userName;
    }

    // Build profile update object
    const profileUpdate = {};


if (profilePictureData) {
  profileUpdate.picture = profilePictureData.url; 
  profileUpdate.filePublicId = profilePictureData.publicId; 
} else if (validatedData.profilePicture) {
  profileUpdate.picture = validatedData.profilePicture;
  profileUpdate.filePublicId = ""; 
}

if (validatedData.about !== undefined) {
  profileUpdate.about = validatedData.about;
}    
   





    if (validatedData.agreed !== undefined) {
  		user.presence.agreed = validatedData.agreed;
    }

    

    // Only update if there are changes
    if (Object.keys(updateFields).length > 0) {
      Object.assign(user, updateFields);
    }

    if (Object.keys(profileUpdate).length > 0) {
      user.profile = { ...user.profile, ...profileUpdate };
      user.profile.updatedAt = new Date();
    }

    user.updatedAt = new Date();

    await user.save();

    // Prepare response data (exclude sensitive info)
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.__v;

    logger.info(`Profile updated successfully for user: ${userId}`);

    return successResponse(
      res,
      'Profile updated successfully',
      {
        user: userResponse,
        changes: {
          profilePictureUpdated: !!profilePictureData || !!validatedData.profilePicture,
          fieldsUpdated: Object.keys({ ...updateFields, ...profileUpdate })
        }
      },
      200
    );

  } catch (error) {
    logger.error('Profile update error:', {
      userId,
      error: error.message,
      stack: error.stack
    });

    if (error.code === 11000) {
      return errorResponse(res, 'Username already exists', 409, 'DUPLICATE_USERNAME');
    }

    return errorResponse(
      res,
      process.env.NODE_ENV === 'production' 
        ? 'Failed to update profile' 
        : error.message,
      500,
      'UPDATE_PROFILE_ERROR'
    );
  }
});



export const logout = asyncHandler(async (req, res)=>{
	try {
		res.cookie('auth_token',"",{expires: new Date(0)});
		return response(res,200,'user logout successfully');
	} catch (error) {
		console.log(error);
		return response(res, 500 ,'Internal server error');
	}
})

// Additional profile-related controllers
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.userId;

  try {
    const user = await UserModel.findById(userId)
      .select('-password -__v -createdAt -updatedAt')
      .lean();

    if (!user) {
      return errorResponse(res, 'User not found', 404, 'USER_NOT_FOUND');
    }

    return successResponse(res, 'Profile retrieved successfully', { user });
  } catch (error) {
    logger.error('Get profile error:', error);
    return errorResponse(res, 'Failed to retrieve profile', 500, 'GET_PROFILE_ERROR');
  }
});


//update profile 

// export const updateProfile = async(req, res)=>{
// const {userName, agreed, about} = req.body;
// 	const userId = req.id;

// try {
// 	let user = await UserModel.findOne(userId);
// 	const file = req.file;
// 	if(file){
// 		const uploadResult =  uploadFileToCloudinary(file);
// 		user.profile.picture = uploadResult.secure_url;
// 	}else if(req.body.profilePicture){
// 		user.profile.picture = req.body.profilePicture;
// 	}
// 	if(userName) user.userName = userName;
// 	if(agreed) user.profile.agreed = agreed;
// 	if(about) user.profile.about = about;
// 	user.save();
// 	return response(res, 200, 'user profile updated successfully', user);
// } catch (error) {
// 	console.error('Update Profile Error:', error);
// 		const status = error.statusCode || 500;
// 		return response(res, status, error.message || 'Internal Server Error');
// }


// }