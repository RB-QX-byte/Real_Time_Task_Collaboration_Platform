import Task from '../models/Tasks.model.js';
import List from '../models/Lists.model.js';
import Board from '../models/Boards.model.js';
import Activity from '../models/Activites.model.js';

// Helper function to check board access via list
const checkListAccess = async (listId, userId) => {
    const list = await List.findById(listId).populate('board');
    if (!list) return { hasAccess: false, error: 'List not found' };

    const board = await Board.findById(list.board);
    if (!board) return { hasAccess: false, error: 'Board not found' };

    const hasAccess = board.owner.equals(userId) ||
        board.members.some(member => member.equals(userId));

    if (!hasAccess) return { hasAccess: false, error: 'Access denied' };

    return { hasAccess: true, list, board };
};

// Create a new task
export const createTask = async (req, res, next) => {
    try {
        const { listId } = req.params;
        const { title, description, position } = req.body;
        const userId = req.user._id;

        // Check access
        const access = await checkListAccess(listId, userId);
        if (!access.hasAccess) {
            return res.status(access.error.includes('not found') ? 404 : 403).json({
                success: false,
                message: access.error
            });
        }

        // Auto-calculate position if not provided
        let taskPosition = position;
        if (taskPosition === undefined) {
            const lastTask = await Task.findOne({ list: listId }).sort({ position: -1 });
            taskPosition = lastTask ? lastTask.position + 1 : 0;
        }

        const task = await Task.create({
            title,
            description: description || '',
            list: listId,
            position: taskPosition,
            assignee: []
        });

        // Add task to list
        access.list.tasks.push(task._id);
        await access.list.save();

        // Emit Socket event
        const io = req.app.get('io');
        io.to(`board:${access.board._id}`).emit('taskCreated', task);

        // Log activity
        await Activity.create({
            type: 'task_created',
            user: userId,
            board: access.board._id,
            task: task._id,
            details: `Task "${title}" created in list "${access.list.title}"`
        });

        return res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: { task }
        });
    } catch (error) {
        next(error);
    }
};

// Get all tasks for a list
export const getTasks = async (req, res, next) => {
    try {
        const { listId } = req.params;
        const userId = req.user._id;

        // Check access
        const access = await checkListAccess(listId, userId);
        if (!access.hasAccess) {
            return res.status(access.error.includes('not found') ? 404 : 403).json({
                success: false,
                message: access.error
            });
        }

        const tasks = await Task.find({ list: listId })
            .populate('assignee', 'username email')
            .sort({ position: 1 });

        return res.status(200).json({
            success: true,
            data: { tasks }
        });
    } catch (error) {
        next(error);
    }
};

// Get a specific task
export const getTaskById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const task = await Task.findById(id)
            .populate('assignee', 'username email')
            .populate('list');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check access via list
        const access = await checkListAccess(task.list._id, userId);
        if (!access.hasAccess) {
            return res.status(403).json({
                success: false,
                message: access.error
            });
        }

        return res.status(200).json({
            success: true,
            data: { task }
        });
    } catch (error) {
        next(error);
    }
};

// Update task
export const updateTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const userId = req.user._id;

        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check access
        const access = await checkListAccess(task.list, userId);
        if (!access.hasAccess) {
            return res.status(403).json({
                success: false,
                message: access.error
            });
        }

        // Update fields
        if (updates.title) task.title = updates.title;
        if (updates.description !== undefined) task.description = updates.description;
        if (updates.assignee) task.assignee = updates.assignee;
        if (updates.position !== undefined) task.position = updates.position;

        await task.save();
        await task.populate('assignee', 'username email');

        // Emit Socket event
        const io = req.app.get('io');
        io.to(`board:${access.board._id}`).emit('taskUpdated', task);

        // Log activity
        await Activity.create({
            type: 'task_updated',
            user: userId,
            board: access.board._id,
            task: task._id,
            details: `Task "${task.title}" updated`
        });

        return res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data: { task }
        });
    } catch (error) {
        next(error);
    }
};

// Move task to different list (drag-drop)
export const moveTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { listId, position } = req.body;
        const userId = req.user._id;

        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check access to original list
        const oldAccess = await checkListAccess(task.list, userId);
        if (!oldAccess.hasAccess) {
            return res.status(403).json({
                success: false,
                message: oldAccess.error
            });
        }

        const oldListId = task.list;

        // If moving to different list
        if (listId && listId !== task.list.toString()) {
            // Check access to new list
            const newAccess = await checkListAccess(listId, userId);
            if (!newAccess.hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: newAccess.error
                });
            }

            // Remove from old list
            await List.findByIdAndUpdate(oldListId, {
                $pull: { tasks: task._id }
            });

            // Add to new list
            await List.findByIdAndUpdate(listId, {
                $push: { tasks: task._id }
            });

            task.list = listId;
        }

        // Update position
        if (position !== undefined) {
            task.position = position;
        }

        await task.save();

        // Emit Socket event
        const io = req.app.get('io');
        io.to(`board:${oldAccess.board._id}`).emit('taskMoved', {
            taskId: task._id,
            oldListId,
            newListId: listId || oldListId,
            position: task.position
        });

        // Log activity
        await Activity.create({
            type: 'task_moved',
            user: userId,
            board: oldAccess.board._id,
            task: task._id,
            details: `Task "${task.title}" moved`
        });

        return res.status(200).json({
            success: true,
            message: 'Task moved successfully',
            data: { task }
        });
    } catch (error) {
        next(error);
    }
};

// Delete task
export const deleteTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check access
        const access = await checkListAccess(task.list, userId);
        if (!access.hasAccess) {
            return res.status(403).json({
                success: false,
                message: access.error
            });
        }

        // Remove task from list
        await List.findByIdAndUpdate(task.list, {
            $pull: { tasks: id }
        });

        await Task.findByIdAndDelete(id);

        // Emit Socket event
        const io = req.app.get('io');
        io.to(`board:${access.board._id}`).emit('taskDeleted', { taskId: id });

        // Log activity
        await Activity.create({
            type: 'task_deleted',
            user: userId,
            board: access.board._id,
            details: `Task "${task.title}" deleted`
        });

        return res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Assign user to task
export const assignUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId: assigneeId } = req.body;
        const userId = req.user._id;

        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check access
        const access = await checkListAccess(task.list, userId);
        if (!access.hasAccess) {
            return res.status(403).json({
                success: false,
                message: access.error
            });
        }

        // Check if already assigned
        if (task.assignee.includes(assigneeId)) {
            return res.status(400).json({
                success: false,
                message: 'User already assigned to this task'
            });
        }

        task.assignee.push(assigneeId);
        await task.save();
        await task.populate('assignee', 'username email');

        // Emit Socket event
        const io = req.app.get('io');
        io.to(`board:${access.board._id}`).emit('taskAssigned', { taskId: id, assigneeId });

        // Log activity
        await Activity.create({
            type: 'task_assigned',
            user: userId,
            board: access.board._id,
            task: task._id,
            details: `User assigned to task "${task.title}"`
        });

        return res.status(200).json({
            success: true,
            message: 'User assigned successfully',
            data: { task }
        });
    } catch (error) {
        next(error);
    }
};

// Unassign user from task
export const unassignUser = async (req, res, next) => {
    try {
        const { id, userId: assigneeId } = req.params;
        const userId = req.user._id;

        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check access
        const access = await checkListAccess(task.list, userId);
        if (!access.hasAccess) {
            return res.status(403).json({
                success: false,
                message: access.error
            });
        }

        task.assignee = task.assignee.filter(a => !a.equals(assigneeId));
        await task.save();
        await task.populate('assignee', 'username email');

        // Emit Socket event
        const io = req.app.get('io');
        io.to(`board:${access.board._id}`).emit('taskUnassigned', { taskId: id, assigneeId });

        // Log activity
        await Activity.create({
            type: 'task_unassigned',
            user: userId,
            board: access.board._id,
            task: task._id,
            details: `User unassigned from task "${task.title}"`
        });

        return res.status(200).json({
            success: true,
            message: 'User unassigned successfully',
            data: { task }
        });
    } catch (error) {
        next(error);
    }
};
