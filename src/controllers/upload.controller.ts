import { Request, Response } from 'express';
import { UploadService } from '../service/upload.service';
import { Logger } from '../utils/logger.util';

const uploadServiceInstance = new UploadService();

export class UploadController {
    async uploadFile(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            const data = await uploadServiceInstance.uploadFile({ file: req.file });

            res.status(200).json({
                success: true,
                message: data.message,
                file: data.file,
            });
        } catch (error: any) {
            Logger.error('Upload error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    }

    async deleteFile(req: Request, res: Response) {
        try {
            const { fileKey } = req.body;

            if (!fileKey) {
                return res.status(400).json({
                    success: false,
                    error: 'File key is required'
                });
            }

            const result = await uploadServiceInstance.deleteFile(fileKey);

            res.status(200).json(result);
        } catch (error: any) {
            Logger.error('Delete error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    }
}
