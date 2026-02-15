import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import boardsReducer from './slices/boardsSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        boards: boardsReducer,
    },
});

export default store;
