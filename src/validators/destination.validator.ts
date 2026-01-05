import Joi from 'joi';

export const destinationCreateSchema = Joi.object({
    country: Joi.string().required(),
    city: Joi.string().required(),
    bestTimeToVisit: Joi.string().optional(),
    avgCost: Joi.number().min(0).optional(),
    activities: Joi.array().items(Joi.string()).optional(),
    safetyScore: Joi.number().min(0).max(100).optional(),
    metadata: Joi.object().optional(),
});

export const destinationUpdateSchema = Joi.object({
    country: Joi.string().optional(),
    city: Joi.string().optional(),
    bestTimeToVisit: Joi.string().optional(),
    avgCost: Joi.number().min(0).optional(),
    activities: Joi.array().items(Joi.string()).optional(),
    safetyScore: Joi.number().min(0).max(100).optional(),
    metadata: Joi.object().optional(),
});

export const destinationListSchema = Joi.object({
    country: Joi.string().optional(),
    city: Joi.string().optional(),
    activities: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
    minCost: Joi.number().min(0).optional(),
    maxCost: Joi.number().min(0).optional(),
    safetyMin: Joi.number().min(0).optional(),
    safetyMax: Joi.number().min(0).optional(),
    search: Joi.string().optional(),
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).max(100).optional(),
});

