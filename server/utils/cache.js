import { redisClient } from "../configs/redis.js";

export const getCache = async (key) => {
  if (!redisClient || !redisClient.isOpen) return null;
  const value = await redisClient.get(key);
  return value ? JSON.parse(value) : null;
};

export const setCache = async (key, value, ttlSeconds) => {
  if (!redisClient || !redisClient.isOpen) return;
  const payload = JSON.stringify(value);
  if (ttlSeconds) {
    await redisClient.setEx(key, ttlSeconds, payload);
  } else {
    await redisClient.set(key, payload);
  }
};

export const deleteCache = async (key) => {
  if (!redisClient || !redisClient.isOpen) return;
  await redisClient.del(key);
};
