import express from 'express';

import { search } from '../controllers/search.controller.js';

import authMiddleware from '../middleware/auth.middleware.js';  // Middleware to protect routes with JWT


const router = express.Router();

router.get('/', authMiddleware, search);  // /api/search?q=keyword

export default router;