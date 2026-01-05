const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
];

const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
];

const ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
];

export const ALLOWED_FILE_TYPES = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_DOCUMENT_TYPES,
    ...ALLOWED_VIDEO_TYPES,
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB default
export const MAX_FILE_SIZE_VIDEOS = 50 * 1024 * 1024; // 50MB for videos

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

export class FileValidator {
    /**
     * Validate file MIME type
     */
    static validateMimeType(mimetype: string): FileValidationResult {
        if (!ALLOWED_FILE_TYPES.includes(mimetype)) {
            return {
                valid: false,
                error: `File type ${mimetype} is not allowed. Allowed types: images, documents, and videos.`,
            };
        }
        return { valid: true };
    }

    /**
     * Validate file size
     */
    static validateFileSize(size: number, mimetype: string): FileValidationResult {
        const maxSize = ALLOWED_VIDEO_TYPES.includes(mimetype) ? MAX_FILE_SIZE_VIDEOS : MAX_FILE_SIZE;

        if (size > maxSize) {
            const maxSizeMB = maxSize / (1024 * 1024);
            return {
                valid: false,
                error: `File size exceeds the maximum allowed size of ${maxSizeMB}MB.`,
            };
        }
        return { valid: true };
    }

    /**
     * Validate file extension
     */
    static validateFileExtension(filename: string): FileValidationResult {
        const allowedExtensions = [
            '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv',
            '.mp4', '.mpeg', '.mov', '.avi', '.webm',
        ];

        const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));

        if (!allowedExtensions.includes(extension)) {
            return {
                valid: false,
                error: `File extension ${extension} is not allowed.`,
            };
        }
        return { valid: true };
    }

    /**
     * Comprehensive file validation
     */
    static validateFile(file: Express.Multer.File): FileValidationResult {
        // Validate MIME type
        const mimeTypeValidation = this.validateMimeType(file.mimetype);
        if (!mimeTypeValidation.valid) {
            return mimeTypeValidation;
        }

        // Validate file size
        const fileSizeValidation = this.validateFileSize(file.size, file.mimetype);
        if (!fileSizeValidation.valid) {
            return fileSizeValidation;
        }

        // Validate file extension
        const extensionValidation = this.validateFileExtension(file.originalname);
        if (!extensionValidation.valid) {
            return extensionValidation;
        }

        return { valid: true };
    }
}
