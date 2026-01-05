import Joi from 'joi';

export const labelCreateSchema = Joi.object({
    name: Joi.string().required().min(1).max(50),
    color: Joi.string().required().pattern(/^#[0-9A-Fa-f]{6}$/),
    description: Joi.string().optional().allow('').max(255),
});

export const labelUpdateSchema = Joi.object({
    name: Joi.string().optional().min(1).max(50),
    color: Joi.string().optional().pattern(/^#[0-9A-Fa-f]{6}$/),
    description: Joi.string().optional().allow('').max(255),
});

export const assignLabelSchema = Joi.object({
    labelId: Joi.string().uuid().required(),
    assignedBy: Joi.string().uuid().required(),
});
