import express from 'express';
import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    moveTask,
    deleteTask,
    assignUser,
    unassignUser
} from '../controllers/tasks.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createTaskSchema, updateTaskSchema, moveTaskSchema } from '../validation/schemas.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Nested under /api/lists/:listId
// POST /api/lists/:listId/tasks - Create new task
router.post('/:listId/tasks', validate(createTaskSchema), createTask);

// GET /api/lists/:listId/tasks - Get all tasks for list
router.get('/:listId/tasks', getTasks);

// The routes below use task ID directly (mounted at /api/lists but path resolves)
// GET /api/lists/task/:id - Get specific task
router.get('/task/:id', getTaskById);

// PUT /api/lists/task/:id - Update task
router.put('/task/:id', validate(updateTaskSchema), updateTask);

// PATCH /api/lists/task/:id/move - Move task (drag-drop)
router.patch('/task/:id/move', validate(moveTaskSchema), moveTask);

// DELETE /api/lists/task/:id - Delete task
router.delete('/task/:id', deleteTask);

// POST /api/lists/task/:id/assign - Assign user to task
router.post('/task/:id/assign', assignUser);

// DELETE /api/lists/task/:id/assign/:userId - Unassign user from task
router.delete('/task/:id/assign/:userId', unassignUser);

export default router;