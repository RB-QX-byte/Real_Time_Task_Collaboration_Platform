dotenv.config();
import app from "./src/app.js";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "../db/db";
import { Socket } from "socket.io";


connectDB(); // Connect to MongoDB before starting the server
app.use(cors());
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const io = new Socket(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

