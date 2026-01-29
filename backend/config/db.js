import mongoose from "mongoose";

const connectDB = async () => {
	if (!process.env.MONGO_URI) {
		console.error("MONGO_URI missing");
		throw new Error("MONGO_URI missing");
	}

	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log('db server is connected');
	} catch (error) {
		console.error("MongoDB connection error:", error.message);
		throw error;
	}

	mongoose.connection.on("error", (err) => {
		console.error("MongoDB runtime error:", err.message);
	});

	mongoose.connection.on("disconnected", () => {
		console.log("MongoDB disconnected");
	});
};

export default connectDB;