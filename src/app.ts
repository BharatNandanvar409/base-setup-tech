import 'reflect-metadata'
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors'
import path from 'path'
import { sequelize } from './config/database';
import authRoutes from './routes/auth.routes'
import uploadRoutes from './routes/upload.routes'

const app = express();
app.use(cors())
app.use(express.json())

app.get('/health', (_req: Request, res: Response) => {
    return res.status(200).json({
        success: true,
        message: 'Server is up and running',
    });
});

app.use('/auth', authRoutes)
app.use('/assets', uploadRoutes)
app.get('/health', (_req: Request, res: Response) => {
    return res.status(200).json({
        success: true,
        message: 'Server is up and running',
    });
});

app.use(
    (err: Error, _req: Request, res: Response, _next: NextFunction) => {
        console.error('Error:', err.message);
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

sequelize
    .sync({ alter: false}) 
    .then(() => console.log("Database connected"))
    .catch((err) => console.log("DB Error", err));

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
export default app