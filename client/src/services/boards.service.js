import api from './api';

export const boardsService = {
    getBoards: async () => {
        const response = await api.get('/boards');
        return response.data;
    },

    getBoardById: async (id) => {
        const response = await api.get(`/boards/${id}`);
        return response.data;
    },

    createBoard: async (boardData) => {
        const response = await api.post('/boards', boardData);
        return response.data;
    },

    updateBoard: async (id, updates) => {
        const response = await api.put(`/boards/${id}`, updates);
        return response.data;
    },

    deleteBoard: async (id) => {
        const response = await api.delete(`/boards/${id}`);
        return response.data;
    },

    addMember: async (boardId, userId) => {
        const response = await api.post(`/boards/${boardId}/members`, { userId });
        return response.data;
    },

    removeMember: async (boardId, memberId) => {
        const response = await api.delete(`/boards/${boardId}/members/${memberId}`);
        return response.data;
    },

    getActivities: async (boardId, page = 1, limit = 20) => {
        const response = await api.get(`/boards/${boardId}/activities?page=${page}&limit=${limit}`);
        return response.data;
    },
};
