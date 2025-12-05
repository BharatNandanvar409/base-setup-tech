import { Request, Response } from "express";
import { uploadService } from "../service/upload.service";

const uploadServiceInstance = new uploadService();
export class uploadController {
    async uploadFile(req: Request, res: Response){
        try {
            if(!req.file){
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const data = await uploadServiceInstance.uploadFile(req);
            res.status(200).json({
                success: true,
                message: data.message,
                file: data.file,
            });
        } catch (error:any) {
            res.status(500).json({ error: error.message ||'Internal server error' });
        }
    }
}