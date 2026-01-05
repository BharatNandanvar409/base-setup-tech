import { NextFunction, Request, Response } from "express";

export const validate =
    (schema: any) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (typeof schema?.validateSync === "function") {
                req.body = schema.validateSync(req.body, { abortEarly: false });
                return next();
            }

            if (typeof schema?.validate === "function") {
                const { error, value } = schema.validate(req.body, {
                    abortEarly: false,
                });
                if (error) {
                    return res.status(400).json({
                        success: false,
                        message: "Validation error",
                        errors: error?.details?.map((d: any) => ({
                            field: Array.isArray(d.path)
                                ? d.path.join(".")
                                : d.path,
                            message: d.message.replace(/"/g, ""),
                        })),
                    });
                }
                req.body = value;
                return next();
            }

            return res
                .status(500)
                .json({ success: false, message: "Invalid validation schema" });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message || "Validation error",
                errors: error.inner?.map((err: any) => ({
                    field: err.path,
                    message: err.message,
                })),
            });
        }
    };
