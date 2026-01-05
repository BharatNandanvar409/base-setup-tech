import redisClient from "../config/redis";

export class CacheService {
    static async set(key: string, value: any, ttl = 60) {
        await redisClient.set(key, JSON.stringify(value), {
            EX: ttl,
        });
    }

    static async get<T>(key: string): Promise<T | null> {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    }

    static async del(key: string) {
        await redisClient.del(key);
    }
}