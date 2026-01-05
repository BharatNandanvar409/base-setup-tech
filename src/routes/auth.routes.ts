import { Router } from "express";
import { AuthController } from "../controllers";
import { sequelize } from "../config/database";
import { validate } from "../middleware";
import { loginSchema, registerSchema } from "../validators/auth.validator";

const router = Router()
const controller = new AuthController();
router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
router.get("/users", controller.getAllUser.bind(controller));

export default router
