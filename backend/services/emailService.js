import nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS
	}
});


transporter.verify().then(() => {
	console.log('Email Service: Connected');
}).catch(err => {
	console.error('Email Service: Connection Failed', err.message);
});

export const sendEmailOtp = async (email, otp) => {
	try {
		const mailOptions = {
			from: `"Your App Name" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: 'Your Verification Code',
			html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Login Verification</h2>
                    <p>Your One-Time Password is:</p>
                    <h1 style="color: #4CAF50;">${otp}</h1>
                    <p>This code expires in 5 minutes.</p>
                </div>
            `
		};

		await transporter.sendMail(mailOptions);
		return true;
	} catch (error) {
		console.error(`Failed to send email to ${email}:`, error);
		throw new Error('Failed to send email verification');
	}
};