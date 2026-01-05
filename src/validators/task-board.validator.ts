import Joi from 'joi';

export const taskBoardCreateSchema = Joi.object({
    taskType: Joi.string()
        .valid(
            'material_request',
            'purchase_request',
            'purchase_quotes',
            'purchase_order',
            'proforma_invoice',
            'container',
            'packaging_list',
            'commercial_invoice'
        )
        .required(),
    title: Joi.string().trim().required(),
    description: Joi.string().allow('').optional(),
    assignedTo: Joi.alternatives()
        .try(
            Joi.array().items(Joi.string().uuid()).min(1),
            Joi.string().uuid()
        )
        .optional()
        .default([]),
    startDate: Joi.date().required(),
    endDate: Joi.date().optional().allow(null),
    currentStatus: Joi.string().required(),
    currentState: Joi.string().allow('').optional(),
    labels: Joi.array().items(Joi.string().uuid()).optional().default([])
});


export const taskBoardUpdateStatusSchema = Joi.object({
    newStatus: Joi.string().required(),
    newState: Joi.string().optional().allow(''),
    labels: Joi.array().optional(),
    changedBy: Joi.string().uuid().required(),
});

export const taskBoardListSchema = Joi.object({
    taskType: Joi.string()
        .valid(
            'material_request',
            'purchase_request',
            'purchase_quotes',
            'purchase_order',
            'proforma_invoice',
            'container',
            'packaging_list',
            'commercial_invoice'
        )
        .optional(),
    assignedTo: Joi.string().uuid().optional(),
    currentStatus: Joi.string().optional(),
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).max(100).optional(),
});

export const taskBoardDragDropSchema = Joi.object({
    newStatus: Joi.string().required(),
    changedBy: Joi.string().uuid().required(),
});

