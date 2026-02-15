import Board from '../models/Boards.model.js';
import List from '../models/Lists.model.js';
import Task from '../models/Tasks.model.js';

// Global search across boards, lists, and tasks
export const search = async (req, res, next) => {
    try {
        const { q } = req.query;
        const userId = req.user._id;

        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        // Create regex for case-insensitive search
        const searchRegex = new RegExp(q, 'i');

        // Search boards user has access to
        const boards = await Board.find({
            $and: [
                {
                    $or: [
                        { owner: userId },
                        { members: userId }
                    ]
                },
                { name: searchRegex }
            ]
        })
            .select('name owner members')
            .populate('owner', 'username email')
            .limit(10);

        // Get board IDs user has access to
        const accessibleBoards = await Board.find({
            $or: [
                { owner: userId },
                { members: userId }
            ]
        }).select('_id');

        const boardIds = accessibleBoards.map(b => b._id);

        // Search lists in accessible boards
        const lists = await List.find({
            $and: [
                { board: { $in: boardIds } },
                { title: searchRegex }
            ]
        })
            .populate('board', 'name')
            .limit(10);

        // Search tasks in accessible boards
        const tasks = await Task.find({
            list: {
                $in: await List.find({ board: { $in: boardIds } }).distinct('_id')
            },
            $or: [
                { title: searchRegex },
                { description: searchRegex }
            ]
        })
            .populate('list', 'title')
            .populate('assignee', 'username email')
            .limit(20);

        return res.status(200).json({
            success: true,
            data: {
                query: q,
                results: {
                    boards,
                    lists,
                    tasks
                },
                count: {
                    boards: boards.length,
                    lists: lists.length,
                    tasks: tasks.length,
                    total: boards.length + lists.length + tasks.length
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
