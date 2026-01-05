import 'reflect-metadata';
import redisClient, { connectRedis } from './config/redis';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { sequelize } from './config/database';
import path from 'path';
import moduleRoutes from './routes/module.routes';
import authRoutes from './routes/auth.routes';
import uploadRoutes from './routes/upload.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/orders.routes';
import auditRoutes from './routes/audit.routes';
import preferencesRoutes from './routes/preferences.routes';
import destinationsRoutes from './routes/destinations.routes';
import tripsRoutes from './routes/trips.routes';
import itineraryRoutes from './routes/itinerary.routes';
import taskBoardRoutes from './routes/task-board.routes';
import labelRoutes from './routes/label.routes';
import notificationRoutes from './routes/notification.routes';
import { Logger } from './utils/logger.util';
import { apiLogsMiddleware } from './middleware';
import { requestContextMiddleware } from './middleware/request-context.middleware';
import swaggerUi from 'swagger-ui-express';
// import { initSocket } from './utils/socket.helper';
import http from 'http';
import { initSocket } from './utils/socket.helper';
const swaggerDocument = require('./swagger/swagger.json');
import { auditQueue } from './queues/audit.queue';



const app = express();
const server = http.createServer(app);
app.use(cors())
app.use(express.json());
app.use(requestContextMiddleware);
app.use(apiLogsMiddleware);

app.get('/health', (_req: Request, res: Response) => {
    return res.status(200).json({
        success: true,
        message: 'Server is up and running',
    });
});

app.use('/auth', authRoutes);
app.use('/assets', uploadRoutes);
app.use('/modules', moduleRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/audit', auditRoutes);
app.use('/preferences', preferencesRoutes);
app.use('/destinations', destinationsRoutes);
app.use('/trips', tripsRoutes);
app.use('/itinerary', itineraryRoutes);
app.use('/task-board', taskBoardRoutes);
app.use('/labels', labelRoutes);
app.use('/notifications', notificationRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.post('/email', async (req: Request, res: Response) => {
    const { order, user, oldOrder, newOrder } = req.body;
    await auditQueue.add(
        'audit-log',
        {
            entity: 'ORDER',
            entityId: order.id,
            action: 'UPDATE',
            actorId: user.id,
            actorRole: user.role,
            before: oldOrder,
            after: newOrder,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date().toISOString(),
        },
        {
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
        },
    );
});

app.use(express.static(path.join(__dirname, '../public')));
const PORT = process.env.PORT || 5001
console.log("🚀 ~ PORT:", PORT)
app.use(
    (err: Error, _req: Request, res: Response, _next: NextFunction) => {
        Logger.error('Unhandled error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
            statusCode: 500,
            status: 'Error',
        });
    }
);
(async () => {
    try {
        await connectRedis();          // ✅ FIRST
        Logger.success('Redis ready');

        initSocket(server);            // ✅ AFTER Redis

        server.listen(PORT, () => {
            Logger.success(`Server running on port ${PORT}`);
            Logger.success('Swagger UI available at /api-docs');
        });
    } catch (error) {
        Logger.error('Startup failed', error);
        process.exit(1);
    }
})();

sequelize
    .sync({ alter: true })
    .then(() => Logger.success('Database connected successfully'))
    .catch((err) => Logger.error('Database connection error:', err));

process.on('SIGINT', async () => {
    await redisClient.quit();
    Logger.warn('Redis connection closed');
    process.exit(0);
});

// server.listen(PORT, () => {
//     Logger.success(`Server running on port ${PORT}`);
//     Logger.success('Swagger UI available at /api-docs');
// });



export default app
