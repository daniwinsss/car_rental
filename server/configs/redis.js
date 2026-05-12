import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

export const redisClient = redisUrl
  ? createClient({ url: redisUrl })
  : null;

export const connectRedis = async () => {
  if (!redisClient || redisClient.isOpen) return;
  redisClient.on("error", (err) => {
    console.error("Redis error:", err.message);
  });
  await redisClient.connect();
  console.log("Redis connected");
};
