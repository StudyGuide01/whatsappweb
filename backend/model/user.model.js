import mongoose from "mongoose";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema({
	// IDENTITY & AUTH
	phoneNumber: { type: String, unique: true, sparse: true, trim: true, index: true },
	countryCode: { type: String }, // Standardized (e.g., "+1", "+91")
	userName: {
		type: String, trim: true, index: { unique: true, sparse: true } // Sparse allows nulls while maintaining uniqueness
	},
	displayName: { type: String, trim: true }, // What people actually see
	email: {
		type: String, lowercase: true, trim: true, match: [emailRegex, 'Invalid email format'], index: { unique: true, sparse: true }
	},



	// SECURITY & VERIFICATION
	auth: {
		otp: { type: String, select: false }, // Never return OTP in API responses
		otpExpiry: { type: Date, select: false },
		isVerified: { type: Boolean, default: false },
		lastLogin: { type: Date },
		accountStatus: {
			type: String, enum: ['active', 'suspended', 'deactivated'], default: 'active'
		}
	},

	// PROFILE
	profile: {
		picture: { type: String, default: "" }, about: { type: String, maxLength: 150 }, filePublicId: { type: String }, locale: { type: String, default: 'en' }, timezone: { type: String }
	},

	// REAL-TIME & PRESENCE (See Note below on Scaling)
	presence: {
		lastSeen: { type: Date, default: Date.now }, isOnline: { type: Boolean, default: false }, agreed: { type: Boolean }, socketId: { type: String, select: false } // Internal use for routing
	},

	// PRIVACY SETTINGS (Critical for Chat Apps)
	settings: {
		pushNotifications: { type: Boolean, default: true },
		privacyLastSeen: {
			type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone'
		},
		privacyProfilePhoto: {
			type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone'
		}
	},

	// SOCIAL & RELATIONSHIPS
	// Using references instead of large arrays to prevent document bloating
	blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

	// PUSH TOKENS (Array allows for multiple devices: Phone, Tablet, Web)
	fcmTokens: [{
		token: { type: String },
		deviceType: { type: String, enum: ['ios', 'android', 'web'] },
		updatedAt: { type: Date, default: Date.now }
	}]

}, {
	timestamps: true,
	// Prevents sending internal/private data to the frontend by default
	toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; return ret; } }
});

// Compound Index for searching users by name or phone efficiently
userSchema.index({ userName: 'text', displayName: 'text' });
userSchema.index({ phoneNumber: 1, countryCode: 1 }, { unique: true, sparse: true });

const UserModel = mongoose.model('User', userSchema);
export default UserModel;















// import mongoose from "mongoose";

// var validateEmail = function (email) {
// 	var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
// 	return re.test(email)
// };

// const userSchema = new mongoose.Schema({
// 	phoneNumber: { type: String, required: true, unique: true, sparse: true },
// 	phoneSuffix: { type: String, required: true, unique: false },
// 	userName: { type: String },
// 	email: {
// 		type: String,
// 		lowercase: true,
// 		trim: true,
// 		required: true,
// 		validate: [validateEmail, 'Please fill a valid email address'],
// 		match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
// 	},
// 	emailOTP: { type: String },
// 	emailOTPExpiry: { type: Date },
// 	profilePicture: { type: String },
// 	about: { type: String },
// 	lastSeen: { type: Date },
// 	isOnline: { type: Boolean, default: false },
// 	isVerified: { type: Boolean, default: false },
// 	agreed: { type: Boolean, default: false }
// }, { timestamps: true });

// const UserModel = mongoose.model('User', userSchema);

// export default UserModel;


