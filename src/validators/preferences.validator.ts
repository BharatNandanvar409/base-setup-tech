import Joi from 'joi';

export const preferencesSchema = Joi.object({
    budgetMin: Joi.number().min(0).optional(),
    budgetMax: Joi.number().min(Joi.ref('budgetMin')).optional(),
    travelType: Joi.string().valid('solo', 'couple', 'family').optional(),
    preferredDestinations: Joi.array().items(Joi.string()).optional(),
    foodInterests: Joi.array().items(Joi.string()).optional(),
    activityInterests: Joi.array().items(Joi.string()).optional(),
});

