import List from '../models/Lists.model.js';
import Board from '../models/Boards.model.js';
import Task from '../models/Tasks.model.js';
import Activity from '../models/Activites.model.js';

// Helper function to check board access
const checkBoardAccess = async (boardId, userId) => {
    const board = await Board.findById(boardId);
    if (!board) return { hasAccess: false, error: 'Board not found' };

    const hasAccess = board.owner.equals(userId) ||
        board.members.some(member => member.equals(userId));

    if (!hasAccess) return { hasAccess: false, error: 'Access denied' };

    return { hasAccess: true, board };
};

// Create a new list
export const createList = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { title, position } = req.body;
        const userId = req.user._id;

        // Check access
        const access = await checkBoardAccess(boardId, userId);
        if (!access.hasAccess) {
            return res.status(access.error === 'Board not found' ? 404 : 403).json({
                success: false,
                message: access.error
            });
        }

        // Auto-calculate position if not provided
        let listPosition = position;
        if (listPosition === undefined) {
            const lastList = await List.findOne({ board: boardId }).sort({ position: -1 });
            listPosition = lastList ? lastList.position + 1 : 0;
        }

        const list = await List.create({
            title,
            board: boardId,
            position: listPosition,
            tasks: []
        });

        // Add list to board
        access.board.lists.push(list._id);
        await access.board.save();

        // Emit Socket event
        const io = req.app.get('io');
        io.to(`board:${boardId}`).emit('listCreated', list);

        // Log activity
        await Activity.create({
            type: 'list_created',
            user: userId,
            board: boardId,
            details: `List "${title}" created`
        });

        return res.status(201).json({
            success: true,
            message: 'List created successfully',
            data: { list }
        });
    } catch (error) {
        next(error);
    }
};

// Get all lists for a board
export const getLists = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const userId = req.user._id;

        // Check access
        const access = await checkBoardAccess(boardId, userId);
        if (!access.hasAccess) {
            return res.status(access.error === 'Board not found' ? 404 : 403).json({
                success: false,
                message: access.error
            });
        }

        const lists = await List.find({ board: boardId })
            .populate({
                path: 'tasks',
                options: { sort: { position: 1 } },
                populate: { path: 'assignee', select: 'username email' }
            })
            .sort({ position: 1 });

        return res.status(200).json({
            success: true,
            data: { lists }
        });
    } catch (error) {
        next(error);
    }
};

// Update list (title, position)
export const updateList = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const userId = req.user._id;

        const list = await List.findById(id);

        if (!list) {
            return res.status(404).json({
                success: false,
                message: 'List not found'
            });
        }

        // Check board access
        const access = await checkBoardAccess(list.board, userId);
        if (!access.hasAccess) {
            return res.status(403).json({
                success: false,
                message: access.error
            });
        }

        // Update fields
        if (updates.title) list.title = updates.title;
        if (updates.position !== undefined) list.position = updates.position;

        await list.save();

        // Emit Socket event
        const io = req.app.get('io');
        io.to(`board:${list.board}`).emit('listUpdated', list);

        // Log activity
        await Activity.create({
            type: 'list_updated',
            user: userId,
            board: list.board,
            details: `List "${list.title}" updated`
        });

        return res.status(200).json({
            success: true,
            message: 'List updated successfully',
            data: { list }
        });
    } catch (error) {
        next(error);
    }
};

// Delete list
export const deleteList = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const list = await List.findById(id);

        if (!list) {
            return res.status(404).json({
                success: false,
                message: 'List not found'
            });
        }

        // Check board access
        const access = await checkBoardAccess(list.board, userId);
        if (!access.hasAccess) {
            return res.status(403).json({
                success: false,
                message: access.error
            });
        }

        // Delete all tasks in the list
        await Task.deleteMany({ list: id });

        // Remove list from board
        await Board.findByIdAndUpdate(list.board, {
            $pull: { lists: id }
        });

        await List.findByIdAndDelete(id);

        // Emit Socket event
        const io = req.app.get('io');
        io.to(`board:${list.board}`).emit('listDeleted', { listId: id });

        // Log activity
        await Activity.create({
            type: 'list_deleted',
            user: userId,
            board: list.board,
            details: `List "${list.title}" deleted`
        });

        return res.status(200).json({
            success: true,
            message: 'List deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
