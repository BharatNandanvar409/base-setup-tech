import Joi from 'joi';

export const registerSchema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    password: Joi.string().required().messages({
        'string.min': 'Password must be at least 6 characters long',
    }).min(6),
    cnf_password: Joi.string().required().valid(Joi.ref('password')).messages({
        'any.only': 'Passwords must match',
    }),
});

export const loginSchema = Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    password: Joi.string().required().min(6).message('Password must be at least 6 characters long'),
});
