import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { upload } from '../middleware/upload.middleware';
import { authMiddleware, isLoggedIn } from '../middleware';

const router = Router();
const uploadControllerInstance = new UploadController();

router.post('/upload', authMiddleware, isLoggedIn, upload.single('file'), uploadControllerInstance.uploadFile);
router.delete('/delete', authMiddleware, isLoggedIn, uploadControllerInstance.deleteFile);

export default router;
