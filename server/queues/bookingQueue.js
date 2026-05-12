import { Queue } from "bullmq";
import { redisClient } from "../configs/redis.js";

const queueConnection = redisClient
  ? redisClient.duplicate()
  : null;

export const bookingQueue = queueConnection
  ? new Queue("bookingQueue", {
      connection: queueConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    })
  : null;

export const addBookingJob = async (name, data, options = {}) => {
  if (!bookingQueue) return;
  await bookingQueue.add(name, data, options);
};
