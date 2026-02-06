import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from './routes/auth.router.js';
import profileRouter from './routes/profileRoutes.js';
import messageRouter from './routes/message.router.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 2026;

/* ----------- Middleware ---------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

//set route middleware
app.use('/api/auth', authRouter);
app.use('/api/auth', profileRouter);
app.use('/api/auth/message', messageRouter);

/* ----------- Middleware ---------------- */

const startServer = async () => {
	try {
		await connectDB();
	} catch (error) {
		console.error("Database connection failed:", error.message);

	}

	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
};

startServer();