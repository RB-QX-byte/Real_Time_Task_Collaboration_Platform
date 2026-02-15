import api from './api';

export const tasksService = {
    getTasks: async (listId) => {
        const response = await api.get(`/lists/${listId}/tasks`);
        return response.data;
    },

    getTaskById: async (id) => {
        const response = await api.get(`/lists/task/${id}`);
        return response.data;
    },

    createTask: async (listId, taskData) => {
        const response = await api.post(`/lists/${listId}/tasks`, taskData);
        return response.data;
    },

    updateTask: async (id, updates) => {
        const response = await api.put(`/lists/task/${id}`, updates);
        return response.data;
    },

    moveTask: async (id, listId, position) => {
        const response = await api.patch(`/lists/task/${id}/move`, { listId, position });
        return response.data;
    },

    deleteTask: async (id) => {
        const response = await api.delete(`/lists/task/${id}`);
        return response.data;
    },

    assignUser: async (taskId, userId) => {
        const response = await api.post(`/lists/task/${taskId}/assign`, { userId });
        return response.data;
    },

    unassignUser: async (taskId, userId) => {
        const response = await api.delete(`/lists/task/${taskId}/assign/${userId}`);
        return response.data;
    },
};
