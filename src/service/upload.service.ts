import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { s3Client, S3_BUCKET_NAME, AWS_REGION } from '../config/s3.config';
import { FileValidator } from '../utils/file-validation.util';
import { Logger } from '../utils/logger.util';
import { FileUploadResponse, S3UploadParams } from '../types/upload.types';

export class UploadService {
    /**
     * Upload file to AWS S3
     */
    async uploadFile(params: S3UploadParams): Promise<FileUploadResponse> {
        try {
            const { file, folder = 'uploads' } = params;

            // Validate file
            const validation = FileValidator.validateFile(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Generate unique file key
            const timestamp = Date.now();
            const sanitizedFileName = file.originalname
                .replace(/\s+/g, '-')
                .replace(/[^a-zA-Z0-9.-]/g, '');
            const fileKey = `${folder}/${timestamp}-${sanitizedFileName}`;

            // Upload to S3 using multipart upload for better handling of large files
            const upload = new Upload({
                client: s3Client,
                params: {
                    Bucket: S3_BUCKET_NAME,
                    Key: fileKey,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    ACL: 'public-read', // Make file publicly accessible
                },
            });

            await upload.done();

            // Construct the file URL
            const fileUrl = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileKey}`;

            Logger.success(`File uploaded successfully: ${fileKey}`);

            return {
                success: true,
                message: 'File uploaded successfully',
                file: {
                    key: fileKey,
                    url: fileUrl,
                    bucket: S3_BUCKET_NAME as any,
                    originalName: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                },
            };
        } catch (error: any) {
            Logger.error('Failed to upload file to S3:', error);
            throw new Error(error.message || 'Failed to upload file');
        }
    }

    /**
     * Delete file from AWS S3
     */
    async deleteFile(fileKey: string): Promise<{ success: boolean; message: string }> {
        try {
            const deleteCommand = new DeleteObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: fileKey,
            });

            await s3Client.send(deleteCommand);

            Logger.success(`File deleted successfully: ${fileKey}`);

            return {
                success: true,
                message: 'File deleted successfully',
            };
        } catch (error: any) {
            Logger.error('Failed to delete file from S3:', error);
            throw new Error(error.message || 'Failed to delete file');
        }
    }
}
