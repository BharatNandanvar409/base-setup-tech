// workers/audit.worker.ts
import { Worker } from 'bullmq';
import { connection } from '../queues';
import { AuditLog } from '../models';
import { IAuditPayload } from '../types/audit.types';

new Worker(
    'audit-queue',
    async (job) => {
        const audit: IAuditPayload = job.data;
        console.log(`Processing Audit Log: ${audit.requestId} - ${audit.method} ${audit.path}`);

        try {
            await AuditLog.create({
                requestId: audit.requestId,
                method: audit.method,
                path: audit.path,
                statusCode: audit.statusCode,
                success: audit.success,
                durationMs: audit.durationMs,
                actorId: audit.actorId,
                prev_data: audit.prev_data,
                update_data: audit.update_data,
                updated_fields: audit.updated_fields
            }as any);
            console.log(`Audit Log Saved: ${audit.requestId}`);
        } catch (error) {
            console.error(`Failed to save audit log ${audit.requestId}:`, error);
            throw error; // Throw to trigger BullMQ retry
        }
    },
    { 
        connection,
        concurrency: 5 // Process 5 audits in parallel
    }
);
