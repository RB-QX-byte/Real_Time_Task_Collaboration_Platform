import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { boardsService } from '../../services/boards.service';

// Async thunks
export const fetchBoards = createAsyncThunk(
    'boards/fetchBoards',
    async (_, { rejectWithValue }) => {
        try {
            const response = await boardsService.getBoards();
            return response.data.boards;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch boards');
        }
    }
);

export const fetchBoardById = createAsyncThunk(
    'boards/fetchBoardById',
    async (boardId, { rejectWithValue }) => {
        try {
            const response = await boardsService.getBoardById(boardId);
            return response.data.board;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch board');
        }
    }
);

export const createBoard = createAsyncThunk(
    'boards/createBoard',
    async (boardData, { rejectWithValue }) => {
        try {
            const response = await boardsService.createBoard(boardData);
            return response.data.board;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create board');
        }
    }
);

export const deleteBoard = createAsyncThunk(
    'boards/deleteBoard',
    async (boardId, { rejectWithValue }) => {
        try {
            await boardsService.deleteBoard(boardId);
            return boardId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete board');
        }
    }
);

const initialState = {
    boards: [],
    currentBoard: null,
    loading: false,
    error: null,
};

const boardsSlice = createSlice({
    name: 'boards',
    initialState,
    reducers: {
        setCurrentBoard: (state, action) => {
            state.currentBoard = action.payload;
        },
        // Real-time updates
        boardCreatedRT: (state, action) => {
            state.boards.push(action.payload);
        },
        boardUpdatedRT: (state, action) => {
            const index = state.boards.findIndex(b => b._id === action.payload._id);
            if (index !== -1) {
                state.boards[index] = action.payload;
            }
            if (state.currentBoard?._id === action.payload._id) {
                state.currentBoard = action.payload;
            }
        },
        boardDeletedRT: (state, action) => {
            state.boards = state.boards.filter(b => b._id !== action.payload.boardId);
            if (state.currentBoard?._id === action.payload.boardId) {
                state.currentBoard = null;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Boards
            .addCase(fetchBoards.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBoards.fulfilled, (state, action) => {
                state.loading = false;
                state.boards = action.payload;
            })
            .addCase(fetchBoards.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Board By ID
            .addCase(fetchBoardById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBoardById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentBoard = action.payload;
            })
            .addCase(fetchBoardById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create Board
            .addCase(createBoard.fulfilled, (state, action) => {
                state.boards.push(action.payload);
            })
            // Delete Board
            .addCase(deleteBoard.fulfilled, (state, action) => {
                state.boards = state.boards.filter(b => b._id !== action.payload);
                if (state.currentBoard?._id === action.payload) {
                    state.currentBoard = null;
                }
            });
    },
});

export const { setCurrentBoard, boardCreatedRT, boardUpdatedRT, boardDeletedRT } = boardsSlice.actions;
export default boardsSlice.reducer;
