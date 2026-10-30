import { Redis } from "@upstash/redis";
import { env } from "./src/env.js";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

async function testRedis() {
  try {
    const key = "upstash:test";
    await redis.set(key, "pong", { ex: 30 });
    const value = await redis.get(key);
    console.log("Redis read/write response:", value);
    console.log("Redis connection successful!");
  } catch (error) {
    console.error("Redis connection failed:", error);
  }
}

testRedis();
