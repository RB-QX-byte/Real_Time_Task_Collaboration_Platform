import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "../db/db";

dotenv.config();

const app = express();


connectDB(); // Connect to MongoDB before starting the server

app.use(cors());
app.use(express.json());

//Here I will add routes for authentication, task management, and real-time collaboration features




export default app;