import express from 'express';
import {
    createBoard,
    getBoards,
    getBoardById,
    updateBoard,
    deleteBoard,
    addMember,
    removeMember
} from '../controllers/boards.controller.js';
import { getActivities } from '../controllers/activites.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createBoardSchema, updateBoardSchema } from '../validation/schemas.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/boards - Create new board
router.post('/', validate(createBoardSchema), createBoard);

// GET /api/boards - Get all boards for user
router.get('/', getBoards);

// GET /api/boards/:id - Get specific board
router.get('/:id', getBoardById);

// PUT /api/boards/:id - Update board
router.put('/:id', validate(updateBoardSchema), updateBoard);

// DELETE /api/boards/:id - Delete board
router.delete('/:id', deleteBoard);

// POST /api/boards/:id/members - Add member to board
router.post('/:id/members', addMember);

// DELETE /api/boards/:id/members/:memberId - Remove member from board
router.delete('/:id/members/:memberId', removeMember);

// GET /api/boards/:id/activities - Get board activities
router.get('/:id/activities', getActivities);

export default router;