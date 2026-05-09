import Redis from "ioredis";
import { env } from "~/env";

export const redis = new Redis(env.REDIS_URL);

const CACHE_EXPIRY_SECONDS = 60 * 60 * 6; // 6 hours
const CACHE_KEY_SEPARATOR = ":";

export const cacheWithRedis = <TFunc extends (...args: any[]) => Promise<any>>(
  keyPrefix: string,
  fn: TFunc,
): TFunc => {
  return (async (...args: Parameters<TFunc>) => {
    if (redis.status !== "ready") {
      return fn(...args);
    }

    const key = `${keyPrefix}${CACHE_KEY_SEPARATOR}${JSON.stringify(args)}`;
    try {
      const cachedResult = await redis.get(key);
      if (cachedResult) {
        console.log(`Cache hit for ${key}`);
        return JSON.parse(cachedResult);
      }
    } catch (error) {
      console.warn("Redis cache read failed", error);
    }

    const result = await fn(...args);
    try {
      await redis.set(key, JSON.stringify(result), "EX", CACHE_EXPIRY_SECONDS);
    } catch (error) {
      console.warn("Redis cache write failed", error);
    }
    return result;
  }) as TFunc;
};
