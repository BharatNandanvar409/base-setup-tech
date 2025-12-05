import { Request } from "express";

export class uploadService {
    async uploadFile(req: Request){
        try {
            if(!req.file){
                throw new Error('No file uploaded');
            }
            const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req?.file?.filename}`
            return {
                success: true,
                message: 'File uploaded successfully',
                file: imageUrl,
            };
        } catch (error:any) {
            throw new Error(error.message ||'Internal server error');
        }
    }
}