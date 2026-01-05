import { Model, Sequelize } from 'sequelize-typescript';
import { auditQueue } from '../queues/audit.queue'; // Your BullMQ queue
import { Transaction } from 'sequelize';

interface EntityTarget {
    model: string; // Table/Model name
    ids: (string | number)[]; // PKs to fetch
    include?: any[]; // Nested relations to capture
}

export class AuditCollector {
    private preState: Record<string, any[]> = {};
    private postState: Record<string, any[]> = {};
    private targets: EntityTarget[] = [];

    constructor(
        private sequelize: Sequelize,
        private transaction: Transaction,
        private context: { requestId: string; actorId?: string; method: string; path: string }
    ) { }

    /**
     * Step 1: Register targets and capture their state BEFORE changes.
     * Call this immediately after starting the transaction, before any writes.
     */
    async snapshotBefore(targets: EntityTarget[]) {
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
        // Filter out unchanged records if needed, or send full snapshots
        const payload = {
            ...this.context,
            prev_data: this.preState,
            updated_data: this.postState,
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

            const data = await model.findAll({
                where: { id: target.ids }, // Assumes 'id' is PK. Can be made generic.
                include: target.include || [],
                transaction: this.transaction,
                raw: false, // Keep as instances to support getters if needed, or use raw: true for speed
                nest: true
            });

            // Group by Table Name
            if (!storage[target.model]) storage[target.model] = [];

            // Store as plain JSON
            storage[target?.model]!.push(...data.map(d => d.toJSON()));
        }
    }
}