import Board from '../models/Boards.model.js';
import List from '../models/Lists.model.js';
import Task from '../models/Tasks.model.js';
import Activity from '../models/Activites.model.js';

// Create a new board
export const createBoard = async (req, res, next) => {
    try {
        const { name } = req.body;
        const userId = req.user._id;

        const board = await Board.create({
            name,
            owner: userId,
            members: [userId] // Owner is automatically a member
        });

        // Populate owner and members
        await board.populate('owner members', 'username email');

        // Get Socket.IO instance and emit event
        const io = req.app.get('io');
        io.emit('boardCreated', board);

        // Log activity
        await Activity.create({
            type: 'board_created',
            user: userId,
            board: board._id,
            details: `Board "${name}" created`
        });

        return res.status(201).json({
            success: true,
            message: 'Board created successfully',
            data: { board }
        });
    } catch (error) {
        next(error);
    }
};

// Get all boards for a user (owned + member)
export const getBoards = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const boards = await Board.find({
            $or: [
                { owner: userId },
                { members: userId }
            ]
        })
            .populate('owner members', 'username email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: { boards }
        });
    } catch (error) {
        next(error);
    }
};

// Get a specific board by ID
export const getBoardById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const board = await Board.findById(id)
            .populate('owner members', 'username email')
            .populate({
                path: 'lists',
                options: { sort: { position: 1 } },
                populate: {
                    path: 'tasks',
                    options: { sort: { position: 1 } },
                    populate: { path: 'assignee', select: 'username email' }
                }
            });

        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Board not found'
            });
        }

        // Check if user has access
        const hasAccess = board.owner._id.equals(userId) ||
            board.members.some(member => member._id.equals(userId));

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not a member of this board.'
            });
        }

        return res.status(200).json({
            success: true,
            data: { board }
        });
    } catch (error) {
        next(error);
    }
};

// Update board (name, members)
export const updateBoard = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const updates = req.body;

        const board = await Board.findById(id);

        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Board not found'
            });
        }

        // Only owner can update board
        if (!board.owner.equals(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Only board owner can update the board'
            });
        }

        // Update fields
        if (updates.name) board.name = updates.name;
        if (updates.members) board.members = updates.members;

        await board.save();
        await board.populate('owner members', 'username email');

        // Emit Socket event
        const io = req.app.get('io');
        io.to(`board:${id}`).emit('boardUpdated', board);

        // Log activity
        await Activity.create({
            type: 'board_updated',
            user: userId,
            board: board._id,
            details: `Board "${board.name}" updated`
        });

        return res.status(200).json({
            success: true,
            message: 'Board updated successfully',
            data: { board }
        });
    } catch (error) {
        next(error);
    }
};

// Delete board
export const deleteBoard = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const board = await Board.findById(id);

        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Board not found'
            });
        }

        // Only owner can delete board
        if (!board.owner.equals(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Only board owner can delete the board'
            });
        }

        // Delete all lists and tasks in the board
        const lists = await List.find({ board: id });
        const listIds = lists.map(list => list._id);

        await Task.deleteMany({ list: { $in: listIds } });
        await List.deleteMany({ board: id });
        await Activity.deleteMany({ board: id });
        await Board.findByIdAndDelete(id);

        // Emit Socket event
        const io = req.app.get('io');
        io.to(`board:${id}`).emit('boardDeleted', { boardId: id });

        return res.status(200).json({
            success: true,
            message: 'Board deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Add member to board
export const addMember = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId: memberUserId } = req.body;
        const userId = req.user._id;

        const board = await Board.findById(id);

        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Board not found'
            });
        }

        // Only owner can add members
        if (!board.owner.equals(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Only board owner can add members'
            });
        }

        // Check if already a member
        if (board.members.includes(memberUserId)) {
            return res.status(400).json({
                success: false,
                message: 'User is already a member'
            });
        }

        board.members.push(memberUserId);
        await board.save();
        await board.populate('members', 'username email');

        // Emit Socket event
        const io = req.app.get('io');
        io.to(`board:${id}`).emit('memberAdded', { boardId: id, memberId: memberUserId });

        return res.status(200).json({
            success: true,
            message: 'Member added successfully',
            data: { board }
        });
    } catch (error) {
        next(error);
    }
};

// Remove member from board
export const removeMember = async (req, res, next) => {
    try {
        const { id, memberId } = req.params;
        const userId = req.user._id;

        const board = await Board.findById(id);

        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Board not found'
            });
        }

        // Only owner can remove members
        if (!board.owner.equals(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Only board owner can remove members'
            });
        }

        board.members = board.members.filter(m => !m.equals(memberId));
        await board.save();

        // Emit Socket event
        const io = req.app.get('io');
        io.to(`board:${id}`).emit('memberRemoved', { boardId: id, memberId });

        return res.status(200).json({
            success: true,
            message: 'Member removed successfully',
            data: { board }
        });
    } catch (error) {
        next(error);
    }
};
