import { Worker } from "bullmq";
import { connection } from "../queues";

const worker = new Worker(
  "email-queue",
  async (job) => {
    const { userId, email } = job.data;

    console.log("Processing email for:", email);
    await new Promise((r) => setTimeout(r, 5000));

    return { success: true };
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});
