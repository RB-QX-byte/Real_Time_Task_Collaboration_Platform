import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import connectDB from "./db/db.js";

// Connect to MongoDB before starting the server
connectDB();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a board room
  socket.on("joinBoard", (boardId) => {
    socket.join(`board:${boardId}`);
    console.log(`User ${socket.id} joined board ${boardId}`);
  });

  // Leave a board room
  socket.on("leaveBoard", (boardId) => {
    socket.leave(`board:${boardId}`);
    console.log(`User ${socket.id} left board ${boardId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Make io accessible to routes
app.set("io", io);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
