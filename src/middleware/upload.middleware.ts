import multer from 'multer';
import { FileValidator, ALLOWED_FILE_TYPES } from '../utils/file-validation.util';
import { Request } from 'express';

// Use memory storage since we're uploading to S3
const storage = multer.memoryStorage();

// File filter for additional validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const validation = FileValidator.validateMimeType(file.mimetype);

    if (!validation.valid) {
        cb(new Error(validation.error));
        return;
    }

    cb(null, true);
};

export const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max (will be validated by FileValidator based on type)
    },
    fileFilter,
});
