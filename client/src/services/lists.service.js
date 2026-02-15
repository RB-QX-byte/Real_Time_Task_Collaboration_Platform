import api from './api';

export const listsService = {
    getLists: async (boardId) => {
        const response = await api.get(`/boards/${boardId}/lists`);
        return response.data;
    },

    createList: async (boardId, listData) => {
        const response = await api.post(`/boards/${boardId}/lists`, listData);
        return response.data;
    },

    updateList: async (listId, updates) => {
        const response = await api.put(`/boards/list/${listId}`, updates);
        return response.data;
    },

    deleteList: async (listId) => {
        const response = await api.delete(`/boards/list/${listId}`);
        return response.data;
    },
};
