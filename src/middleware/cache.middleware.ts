import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../service/cache.service';

export const cacheMiddleware = (keyPrefix: string, ttl = 60) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const key = `${keyPrefix}:${req.originalUrl}`;

        const cachedData = await CacheService.get(key);
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
            CacheService.set(key, body, ttl);
            return originalJson(body);
        };

        next();
    };
};
