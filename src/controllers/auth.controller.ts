import { Request, Response } from "express";
import dotenv from 'dotenv';
import { userService } from "../service";
import { Sequelize } from "sequelize";
import { GetAllUserQueryParamsDTO } from "../constant/basequery.param.dto";

dotenv.config();
const UserService = new userService()

export class authController{
    constructor(
        private readonly sequelize: Sequelize){}
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const user = await UserService.loginUser(email, password);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            const token = await UserService.generateToken(user);
            res.status(200).json({ token });
        } catch (error:any) {
            console.error('Failed to login user:', error.message || (error as Error).message);
            res.status(500).json({ error: error.message ||'Internal server error' });
        }
    }

    async register(req: Request, res: Response) {
        try {
            const user = await UserService.registerUser(req.body);
            res.status(201).json({ user });
        } catch (error:any) {
            res.status(500).json({ error: error.message ||'Internal server error' });
        }
    }

    async getAllUser(req: Request, res: Response) {
        try {
            const data = await UserService.getAllUser(req.query as GetAllUserQueryParamsDTO);
            res.status(200).json({ data });
        } catch (error:any) {
            res.status(500).json({ error: error.message ||'Internal server error' });
        }
    }
}
