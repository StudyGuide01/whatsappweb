
import UserModel from "../model/user.model.js";
// import { sendEmailOtp } from "./emailService.js";
// import { sendEmailOtp } from './emailService.js';
import { sendEmailOtp } from './emailService.js';
import { sendOtpToPhoneNumber, verifyTwilioOtp } from './twilloService.js';
import crypto from 'crypto';


// Constants
const OTP_EXPIRY_MINUTES = 5;

const generateOTP = () => {
	return crypto.randomInt(100000, 999999).toString();
};

// export const handleLoginOtp = async ({ email, phoneNumber, countryCode }) => {
// 	const otp = generateOTP();
// 	const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

// 	let query = {};
// 	let updateData = {
// 		'auth.otp': otp,
// 		'auth.otpExpiry': otpExpiry,
// 	};

// 	if (email) {
// 		query = { email: email.toLowerCase() };
// 	} else {
// 		query = {
// 			phoneNumber: phoneNumber,
// 			countryCode: countryCode
// 		};
// 	}

// 	const user = await UserModel.findOneAndUpdate(
// 		query,
// 		{
// 			$set: updateData,
// 			$setOnInsert: query
// 		},
// 		{ new: true, upsert: true, setDefaultsOnInsert: true }
// 	);

// 	if (email) {
// 		await sendEmailOtp(email, otp);
// 		return {
// 			message: 'OTP sent to your email.',
// 			data: { email: user.email }
// 		};
// 	} else {
// 		const fullPhoneNumber = `${countryCode}${phoneNumber}`;
// 		await sendOtpToPhoneNumber(fullPhoneNumber, otp);
// 		return {
// 			message: 'OTP sent to your phone.',
// 			data: {
// 				phoneNumber: user.phoneNumber,
// 				countryCode: user.countryCode
// 			}
// 		};
// 	}
// };



// export const verifyUserOtp = async ({ email, phoneNumber, countryCode, otp }) => {
// 	let query = {};


// 	// Build Query
// 	if (email) {
// 		query = { email: email.toLowerCase() };
// 	} else {
// 		query = { phoneNumber, countryCode };
// 	}



// 	const user = await UserModel.findOne(query)
// 		.select('+auth.otp +auth.otpExpiry');

// 	if (!user) {
// 		const error = new Error('User not found');
// 		error.statusCode = 404;
// 		throw error;
// 	}

// 	const currentOtp = user.auth?.otp;

// 	const otpExpiry = user.auth?.otpExpiry;
// 	const now = new Date();

// 	if (!currentOtp || !otpExpiry || now > otpExpiry) {
// 		const error = new Error('OTP has expired or is invalid');
// 		error.statusCode = 400;
// 		throw error;
// 	}

// 	const isMatch = compareStringsSafely(String(currentOtp), String(otp));

// 	if (!isMatch) {
// 		const error = new Error('Invalid OTP');
// 		error.statusCode = 400;
// 		throw error;
// 	}

// 	user.auth.isVerified = true;
// 	user.auth.otp = null;
// 	user.auth.otpExpiry = null;
// 	user.auth.lastLogin = new Date();

// 	await user.save();

// 	return user;
// };

// Helper for Timing Safe Comparison





// const compareStringsSafely = (a, b) => {
// 	try {
// 		return crypto.timingSafeEqual(
// 			Buffer.from(a, 'utf-8'),
// 			Buffer.from(b, 'utf-8')
// 		);
// 	} catch (e) {
// 		return false;
// 	}
// };



export const handleLoginOtp = async ({ email, phoneNumber, countryCode }) => {

	const otp = generateOTP();
	const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

	let query = {};
	let updateData = {};

	if (email) {
		query = { email: email.toLowerCase() };

		updateData = {
			auth: {
				otp: otp,
				otpExpiry: otpExpiry
			}
		};
	}
	else {
		query = {
			phoneNumber,
			countryCode
		};
	}

	const user = await UserModel.findOneAndUpdate(
		query,
		{ $set: updateData },
		{ new: true, upsert: true, setDefaultsOnInsert: true }
	);

	// ---------------- EMAIL OTP ----------------
	if (email) {
		await sendEmailOtp(email, otp);
		return {
			message: "OTP sent to your email.",
			data: { email: user.email }
		};
	}

	// ---------------- PHONE OTP ----------------
	const fullPhoneNumber = `${countryCode}${phoneNumber}`;
	await sendOtpToPhoneNumber(fullPhoneNumber);

	return {
		message: "OTP sent to your phone.",
		data: {
			phoneNumber: user.phoneNumber,
			countryCode: user.countryCode
		}
	};
};


export const verifyUserOtp = async ({ email, phoneNumber, countryCode, otp }) => {
	let query = {};

	// --------------------
	// Build Query
	// --------------------
	if (email) {
		query = { email: email.toLowerCase() };
	} else {
		query = { phoneNumber, countryCode };
	}

	const user = await UserModel.findOne(query)
		.select("+auth.otp +auth.otpExpiry");

	if (!user) {
		const error = new Error("User not found");
		error.statusCode = 404;
		throw error;
	}

	// =================================================
	//  PHONE OTP → TWILIO + DATABASE
	// =================================================
	if (phoneNumber) {

		const fullPhone = `${countryCode}${phoneNumber}`;
		const response = await verifyTwilioOtp(fullPhone, otp);

		if (response.status !== "approved") {
			const error = new Error("Invalid OTP OR Expiry OTP");
			error.statusCode = 400;
			throw error;
		}


	}

	// =================================================
	//  EMAIL OTP → DATABASE ONLY
	// =================================================
	if (email) {
		const currentOtp = user.auth?.otp;
		const otpExpiry = user.auth?.otpExpiry;
		const now = new Date();

		if (!currentOtp || !otpExpiry || now > otpExpiry) {
			const error = new Error("OTP has expired or is invalid");
			error.statusCode = 400;
			throw error;
		}

		const isMatch = compareStringsSafely(
			String(currentOtp),
			String(otp)
		);

		if (!isMatch) {
			const error = new Error("Invalid OTP");
			error.statusCode = 400;
			throw error;
		}
	}

	// --------------------
	// Update User
	// --------------------
	user.auth.isVerified = true;
	user.auth.otp = null;
	user.auth.otpExpiry = null;
	user.auth.lastLogin = new Date();

	await user.save();

	return user;
};

// =================================================
// Helper
// =================================================
const compareStringsSafely = (a, b) => {
	try {
		return crypto.timingSafeEqual(
			Buffer.from(a, "utf-8"),
			Buffer.from(b, "utf-8")
		);
	} catch {
		return false;
	}
};