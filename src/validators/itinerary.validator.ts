import Joi from 'joi';

export const itineraryGenerateAutoSchema = Joi.object({
    tripId: Joi.string().required(),
});

export const itineraryGenerateManualSchema = Joi.object({
    tripId: Joi.string().required(),
    days: Joi.array().items(Joi.object({ date: Joi.date().required(), notes: Joi.string().optional() })).min(1).required(),
});

export const itineraryAddActivitySchema = Joi.object({
    title: Joi.string().required(),
    timeStart: Joi.string().optional(),
    timeEnd: Joi.string().optional(),
    order: Joi.number().integer().min(1).optional(),
    notes: Joi.string().optional(),
});

export const itineraryReorderSchema = Joi.object({
    orders: Joi.array().items(Joi.object({ activityId: Joi.string().required(), order: Joi.number().integer().min(1).required() })).min(1).required(),
});

export const itineraryUpdateDaySchema = Joi.object({
    notes: Joi.string().optional(),
    date: Joi.date().optional(),
});

export const itineraryUpdateActivitySchema = Joi.object({
    title: Joi.string().optional(),
    timeStart: Joi.string().optional(),
    timeEnd: Joi.string().optional(),
    order: Joi.number().integer().min(1).optional(),
    notes: Joi.string().optional(),
});

