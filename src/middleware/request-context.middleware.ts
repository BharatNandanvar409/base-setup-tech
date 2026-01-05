import { NextFunction, Request, Response } from 'express';
import { requestAsyncStore } from '../utils/request-context.util';

export const requestContextMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = `${startTime}-${Math.random().toString(36).slice(2, 8)}`;
    const actorId = (req as any).user?.id || null;
    requestAsyncStore.run(
        {
            requestId,
            auditEvents: [],
            actorId,
        },
        () => next()
    );
};
