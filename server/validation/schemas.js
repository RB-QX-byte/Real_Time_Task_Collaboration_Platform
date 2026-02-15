import Joi from 'joi';

// Auth validation schemas
export const signupSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Board validation schemas
export const createBoardSchema = Joi.object({
    name: Joi.string().min(1).max(100).required()
});

export const updateBoardSchema = Joi.object({
    name: Joi.string().min(1).max(100),
    members: Joi.array().items(Joi.string())
}).min(1);

// List validation schemas
export const createListSchema = Joi.object({
    title: Joi.string().min(1).max(100).required(),
    position: Joi.number().min(0)
});

export const updateListSchema = Joi.object({
    title: Joi.string().min(1).max(100),
    position: Joi.number().min(0)
}).min(1);

// Task validation schemas
export const createTaskSchema = Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(2000).allow(''),
    position: Joi.number().min(0)
});

export const updateTaskSchema = Joi.object({
    title: Joi.string().min(1).max(200),
    description: Joi.string().max(2000).allow(''),
    assignee: Joi.array().items(Joi.string()),
    position: Joi.number().min(0)
}).min(1);

export const moveTaskSchema = Joi.object({
    listId: Joi.string().required(),
    position: Joi.number().min(0).required()
});
