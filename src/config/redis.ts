import { createClient } from "redis"
import { Logger } from '../utils/logger.util';

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
    },
})


redisClient.on("connect", () => {
    Logger.success('Redis connected successfully');
})

redisClient.on('error', (err) => {
    Logger.error('Redis connection error', err);
});

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};


export default redisClient;