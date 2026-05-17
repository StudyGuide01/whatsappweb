import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from './routes/auth.router.js';
import profileRouter from './routes/profileRoutes.js';
import messageRouter from './routes/message.router.js';
import initializeSocket from "./socket-services/socket_service.js";
import http from 'node:http';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 2026;

/* ----------- Middleware ---------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
// const corsOrigin = {
// 	origin: process.env.FRONTEND_URL,
// 	credentials:true
// }

// app.use(cors(corsOrigin))


//create server 
const server = http.createServer(app)

const io = initializeSocket(server)

// apply socket middleware  before routes 

app.use((req, res, next)=>{
	req.io = io,
	req.socketUserMap = io.socketUserMap
	next()
})

//set route middleware
app.use('/api/auth', authRouter);
app.use('/api/auth', profileRouter);
app.use('/api/message', messageRouter);

/* ----------- Middleware ---------------- */




const startServer = async () => {
	try {
		await connectDB();
	} catch (error) {
		console.error("Database connection failed:", error.message);

	}

	// app.listen(PORT, () => {
	// 	console.log(`Server running on port ${PORT}`);
	// });

	//after socket implement 
	server.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
};

startServer();