// import { twilio } from 'twilio';
import twilio from 'twilio';

const accountSID = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSID = process.env.TWILO_VERIFY_SERVICE_SID;


const client = twilio(accountSID, authToken);

//send otp
const sendOtpToPhoneNumber = async (phoneNumber) => {
	try {
		console.log('sending otp to this number', phoneNumber);
		if (!phoneNumber) {
			throw new Error('phone number is required');
		}
		const response = await client.verify.v2.services(serviceSID).verifications.create({
			to: phoneNumber,
			channel: 'sms',
		});
		console.log('this is my response', response);
		return response;

	} catch (error) {
		console.log('Error', error);
		throw new Error('failed to send otp');
	}
}

//verify otp
const verifyTwilioOtp = async (phoneNumber, otp) => {
	try {
		console.log('this is my otp', otp);
		console.log('this number', phoneNumber);

		const response = await client.verify.v2.services(serviceSID).verificationChecks.create({
			to: phoneNumber,
			code: otp
		});
		console.log('this is my response', response);
		return response;

	} catch (error) {
		console.log('Error', error);
		throw new Error('otp verification failed');
	}
}


export { sendOtpToPhoneNumber, verifyTwilioOtp };
