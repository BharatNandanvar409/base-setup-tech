import { Router } from "express";
import { authController } from "../controllers";
import { sequelize } from "../config/database";

const router = Router()
const AuthController = new authController(sequelize);
router.post("/register", AuthController.register.bind(AuthController));
router.post("/login", AuthController.login.bind(AuthController));
router.get("/users", AuthController.getAllUser.bind(AuthController));

export default router