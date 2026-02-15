import express from 'express';
import { signup, login, getMe } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { signupSchema, loginSchema } from '../validation/schemas.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/auth/signup - Register new user
router.post('/signup', validate(signupSchema), signup);

// POST /api/auth/login - Login user
router.post('/login', validate(loginSchema), login);

// GET /api/auth/me - Get current user (protected)
router.get('/me', authMiddleware, getMe);

export default router;