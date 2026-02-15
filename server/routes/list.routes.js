import express from 'express';
import {
    createList,
    getLists,
    updateList,
    deleteList
} from '../controllers/lists.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createListSchema, updateListSchema } from '../validation/schemas.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Board-scoped routes (mounted at /api/boards)
// POST /api/boards/:boardId/lists - Create new list
router.post('/:boardId/lists', validate(createListSchema), createList);

// GET /api/boards/:boardId/lists - Get all lists for board
router.get('/:boardId/lists', getLists);

// Standalone list routes (use /list/ prefix to avoid conflict with board /:id)
// PUT /api/boards/list/:id - Update list
router.put('/list/:id', validate(updateListSchema), updateList);

// DELETE /api/boards/list/:id - Delete list
router.delete('/list/:id', deleteList);

export default router;