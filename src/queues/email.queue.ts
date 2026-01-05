import { Queue } from 'bullmq';
import { connection } from './index';

export const emailQueue = new Queue('email-queue', {
    connection,
});
