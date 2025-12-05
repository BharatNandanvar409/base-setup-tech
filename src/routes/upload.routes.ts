import { Router } from "express";
import { uploadController } from "../controllers/upload.controller";
import { upload } from "../middleware/upload.middleware";
import { authMiddleware, isLoggedIn } from "../middleware";

const router = Router()
const uploadControllerInstance = new uploadController();
router.post('/upload',authMiddleware, isLoggedIn ,upload.single("file"), uploadControllerInstance.uploadFile);


export default router