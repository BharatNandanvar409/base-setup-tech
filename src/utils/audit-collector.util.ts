import { Sequelize } from 'sequelize-typescript';
import { auditQueue } from '../queues/audit.queue';
import { IEntityTarget, IAuditPayload } from '../types/audit.types';
import { sanitizeRecord, diffChangedFields } from './audit.util';
import { Transaction } from 'sequelize';

export class AuditCollector {
    private preState: Record<string, any[]> = {};
    private postState: Record<string, any[]> = {};
    private targets: IEntityTarget[] = [];
    private startTime: number;

    constructor(
        private sequelize: Sequelize,
        private transaction: Transaction,
        private context: { 
            requestId: string; 
            actorId?: string | null; 
            method: string; 
            path: string;
        }
    ) {
        this.startTime = Date.now();
    }

    /**
     * Step 1: Register targets and capture their state BEFORE changes.
     * Call this immediately after starting the transaction, before any writes.
     */
    async snapshotBefore(targets: IEntityTarget[]) {
        this.targets = targets;
        await this.captureState(this.preState);
    }

    /**
     * Step 2: Capture state AFTER changes.
     * Call this just before committing the transaction.
     */
    async snapshotAfter() {
        await this.captureState(this.postState);
    }

    /**
     * Step 3: Emit to Queue.
     * Call this immediately AFTER transaction.commit().
     */
    async emit() {
        const durationMs = Date.now() - this.startTime;

        // Calculate changed fields
        const updatedFields: Record<string, string[]> = {};
        
        // This is a simplified diff logic. 
        // In a real scenario, we would match records by ID to find specific changes.
        // For this generic implementation, we will just list fields that exist in both and differ.
        for (const tableName of Object.keys(this.postState)) {
            const preRecords = this.preState[tableName] || [];
            const postRecords = this.postState[tableName] || [];

            // Map by ID for comparison
            const preMap = new Map(preRecords.map(r => [r.id, r]));
            
            for (const postRecord of postRecords) {
                if (postRecord.id && preMap.has(postRecord.id)) {
                    const preRecord = preMap.get(postRecord.id)!;
                    const diff = diffChangedFields(preRecord, postRecord);
                    if (diff.length > 0) {
                        if (!updatedFields[tableName]) updatedFields[tableName] = [];
                        updatedFields[tableName].push(...diff);
                    }
                }
            }
            
            // Deduplicate fields
            if (updatedFields[tableName]) {
                updatedFields[tableName] = [...new Set(updatedFields[tableName])];
            }
        }

        const payload: IAuditPayload = {
            ...this.context,
            statusCode: 200, // Default success
            success: true,
            durationMs,
            prev_data: this.preState,
            update_data: this.postState,
            updated_fields: updatedFields,
            timestamp: new Date(),
        };

        // Fire and forget - guaranteed by BullMQ
        await auditQueue.add('audit-log', payload, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: true,
        });
    }

    private async captureState(storage: Record<string, any[]>) {
        for (const target of this.targets) {
            const model = this.sequelize.model(target.model);
            if (!model) continue;

            // Handle case where ids might be empty
            if (!target.ids || target.ids.length === 0) continue;

            const data = await model.findAll({
                where: { id: target.ids }, // Assumes 'id' is PK.
                include: target.include || [],
                transaction: this.transaction,
                // We use raw: false to get model instances, then toJSON() to get clean data
                // This ensures virtuals or getters might be respected if configured, 
                // though usually raw: true is safer for pure data. 
                // Let's stick to instances -> toJSON for now to match standard Sequelize behavior.
            });

            // Group by Table Name
            if (!storage[target.model]) storage[target.model] = [];
            
            // Store as plain JSON and sanitize
            const records = data.map(d => sanitizeRecord(target.model, d.toJSON()));
            storage[target.model]!.push(...records);
        }
    }
}
