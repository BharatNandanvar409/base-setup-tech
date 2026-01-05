import { NextFunction, Request, Response } from 'express';
import { getMongoAuditCollection } from '../config/mongo.config';
import { Logger } from '../utils/logger.util';
import { requestAsyncStore } from '../utils/request-context.util';
import { AuditLog } from '../models';
import { sanitizeRecord, diffChangedFields } from '../utils/audit.util';

export const apiLogsMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const ctx = requestAsyncStore.getStore();
    const requestId = ctx?.requestId || `${startTime}-${Math.random().toString(36).slice(2, 8)}`;

    let capturedResponseBody: any = undefined;
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = ((body: any) => {
        capturedResponseBody = body;
        return originalJson(body);
    }) as any;

    res.send = ((body?: any) => {
        capturedResponseBody = body;
        return originalSend(body);
    }) as any;

    res.on('finish', async () => {
        try {
            const durationMs = Date.now() - startTime;
            const statusCode = res.statusCode;
            const success = statusCode < 400;
            const actorId = ctx?.actorId || null;

            const prevDataByTable: Record<string, any[]> = {};
            const updateDataByTable: Record<string, any[]> = {};
            const updatedFieldsByTable: Record<string, string[]> = {};
            for (const ev of ctx?.auditEvents || []) {
                const prev = sanitizeRecord(ev.table, ev.prev);
                const next = sanitizeRecord(ev.table, ev.next);
                if (!prevDataByTable[ev.table]) prevDataByTable[ev.table] = [];
                if (!updateDataByTable[ev.table]) updateDataByTable[ev.table] = [];
                if (prev !== null) (prevDataByTable[ev.table]!).push(prev);
                if (next !== null) (updateDataByTable[ev.table]!).push(next);
                if (prev !== null && next !== null) {
                    const changed = diffChangedFields(prev, next);
                    const existing = updatedFieldsByTable[ev.table] || [];
                    const merged = Array.from(new Set([...existing, ...changed]));
                    updatedFieldsByTable[ev.table] = merged;
                }
            }

            await AuditLog.create({
                requestId,
                method: req.method,
                path: req.originalUrl || req.url,
                statusCode,
                success,
                durationMs,
                actorId,
                prev_data: prevDataByTable,
                update_data: updateDataByTable,
                updated_fields: updatedFieldsByTable,
            });

            // const collection = await getMongoAuditCollection();
            // await collection.insertOne({
            //     requestId,
            //     method: req.method,
            //     path: req.originalUrl || req.url,
            //     statusCode,
            //     success,
            //     durationMs,
            //     request: {
            //         headers: {
            //             'user-agent': req.headers['user-agent'],
            //             'content-type': req.headers['content-type'],
            //             'x-forwarded-for': req.headers['x-forwarded-for'],
            //             'authorization': req.headers['authorization'] ? '***' : undefined,
            //         },
            //         query: req.query,
            //         body: req.body,
            //     },
            //     response: {
            //         body: capturedResponseBody,
            //     },
            //     actor: (req as any)?.user || null,
            //     createdAt: new Date(),
            // });
        } catch (err: any) {
            Logger.error('Failed to write API audit log', err);
        }
    });

    next();
};
