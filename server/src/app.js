import express from "express";
import cors from "cors";
import errorHandler from "../utils/errorHandler.js";

// Import routes
import authRoutes from "../routes/auth.routes.js";
import boardRoutes from "../routes/board.routes.js";
import listRoutes from "../routes/list.routes.js";
import taskRoutes from "../routes/tasks.routes.js";
import searchRoutes from "../routes/search.routes.js";

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/boards", listRoutes);     // Lists are nested under boards: /api/boards/:boardId/lists
app.use("/api/lists", taskRoutes);      // Tasks are nested under lists: /api/lists/:listId/tasks
app.use("/api/search", searchRoutes);

// Health check route
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running"
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;