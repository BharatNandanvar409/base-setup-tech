export interface FileUploadResponse {
    success: boolean;
    message: string;
    file?: {
        key: string;
        url: string;
        bucket: string;
        originalName: string;
        mimetype: string;
        size: number;
    };
}

export interface S3UploadParams {
    file: Express.Multer.File;
    folder?: string;
}

export interface FileMetadata {
    key: string;
    url: string;
    bucket: string;
    originalName: string;
    mimetype: string;
    size: number;
    uploadedAt: Date;
}
