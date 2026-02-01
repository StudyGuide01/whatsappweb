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

//update profile 

export const updateProfile = async(req, res)=>{
const {userName, agreed, about} = req.body;
	const userId = req.id;

try {
	let user = await UserModel.findOne(userId);
	const file = req.file;
	if(file){
		// const uploadResul = 
		// user.profile.picture = 
	}
} catch (error) {
	console.error('Update Profile Error:', error);
		const status = error.statusCode || 500;
		return response(res, status, error.message || 'Internal Server Error');
}


}