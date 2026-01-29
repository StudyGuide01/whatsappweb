import jwt from 'jsonwebtoken';


export const generateToken = (userId) => {
	const token = jwt.sign({ 'sub': userId }, process.env.JWT_SECRET, { expiresIn: '1y' });
	return token;
}