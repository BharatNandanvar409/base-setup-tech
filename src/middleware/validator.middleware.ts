import { NextFunction, Request, Response } from "express";
import { AnyObjectSchema } from "yup";

export const validate = (schema: AnyObjectSchema) =>(req: Request, res: Response, next: NextFunction) => {
    try {
        req.body = schema.validateSync(req.body, { abortEarly: false });
        next();
    } catch (error:any) {
        return res.status(400).json({
            success: false,
            message: error.message || 'Validation error',
            errors: error.inner.map((err: any) => ({
                field: err.path,
                message: err.message,
            })),
        });
        
    }
}