import { Queue } from "bullmq";
import { connection } from './index';

export const auditQueue = new Queue("audit-queue", {
    connection,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: 1000,
        removeOnFail: 5000
    }
});
