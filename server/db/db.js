import mongoose from "mongoose";

async function connectDB() {
    // Proper Connection to MongoDB
    try {
        await mongoose.connect(process.env.MONGO_URI, {});
        console.log("Connected to MongoDB");
    } 
    
    catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

export default connectDB;