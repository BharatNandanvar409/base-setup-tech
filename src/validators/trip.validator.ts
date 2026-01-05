import Joi from 'joi';

export const tripCreateSchema = Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
    status: Joi.string().valid('planned', 'ongoing', 'completed').optional(),
    notes: Joi.string().optional(),
    companions: Joi.array().items(Joi.string()).optional(),
    destinationIds: Joi.array().items(Joi.string()).optional(),
});

export const tripAddDestinationSchema = Joi.object({
    tripId: Joi.string().required(),
    destinationId: Joi.string().required(),
    order: Joi.number().integer().min(1).optional(),
});

export const tripSetDatesSchema = Joi.object({
    tripId: Joi.string().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
});

export const tripNotesCompanionsSchema = Joi.object({
    tripId: Joi.string().required(),
    notes: Joi.string().optional(),
    companions: Joi.array().items(Joi.string()).optional(),
});

export const tripUpdateStatusSchema = Joi.object({
    tripId: Joi.string().required(),
    status: Joi.string().valid('planned', 'ongoing', 'completed').required(),
});

