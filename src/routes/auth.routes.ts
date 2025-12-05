import { Router } from "express";
import { authController } from "../controllers";
import { sequelize } from "../config/database";
import { validate } from "../middleware";
import { loginSchema, registerSchema } from "../validators/auth.validator";

const router = Router()
const AuthController = new authController();
router.post("/register", validate(registerSchema), AuthController.register);
router.post("/login", validate(loginSchema), AuthController.login);
router.get("/users", AuthController.getAllUser.bind(AuthController));

export default router