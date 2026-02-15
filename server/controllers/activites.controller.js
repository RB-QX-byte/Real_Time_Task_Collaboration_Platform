import Activity from '../models/Activites.model.js';
import Board from '../models/Boards.model.js';

// Get activities for a board with pagination
export const getActivities = async (req, res, next) => {
    try {
        const boardId = req.params.boardId || req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const userId = req.user._id;

        // Check board access
        const board = await Board.findById(boardId);

        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Board not found'
            });
        }

        const hasAccess = board.owner.equals(userId) ||
            board.members.some(member => member.equals(userId));

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get activities with pagination
        const activities = await Activity.find({ board: boardId })
            .populate('user', 'username email')
            .populate('task', 'title')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        // Get total count for pagination
        const total = await Activity.countDocuments({ board: boardId });

        return res.status(200).json({
            success: true,
            data: {
                activities,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Create activity (helper function)
export const createActivity = async (activityData) => {
    try {
        const activity = await Activity.create(activityData);
        return activity;
    } catch (error) {
        console.error('Error creating activity:', error);
        return null;
    }
};

// Get activity by type filter
export const getActivitiesByType = async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { type } = req.query;
        const userId = req.user._id;

        // Check board access
        const board = await Board.findById(boardId);

        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Board not found'
            });
        }

        const hasAccess = board.owner.equals(userId) ||
            board.members.some(member => member.equals(userId));

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const query = { board: boardId };
        if (type) {
            query.type = type;
        }

        const activities = await Activity.find(query)
            .populate('user', 'username email')
            .populate('task', 'title')
            .sort({ createdAt: -1 })
            .limit(50);

        return res.status(200).json({
            success: true,
            data: { activities }
        });
    } catch (error) {
        next(error);
    }
};
