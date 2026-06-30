import { Redis } from "@upstash/redis";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisClient = new Redis({ url, token });
  return redisClient;
}

function checkRateLimitMemory(
  key: string,
  maxAttempts: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  memoryStore.set(key, entry);
  return { allowed: true, retryAfterMs: 0 };
}

function resetRateLimitMemory(key: string): void {
  memoryStore.delete(key);
}

export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const redis = getRedis();
  if (!redis) {
    return checkRateLimitMemory(key, maxAttempts, windowMs);
  }

  const redisKey = `rl:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.pexpire(redisKey, windowMs);
  }

  const ttl = await redis.pttl(redisKey);
  if (count > maxAttempts) {
    return { allowed: false, retryAfterMs: Math.max(ttl, 0) };
  }

  return { allowed: true, retryAfterMs: 0 };
}

export async function resetRateLimit(key: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(`rl:${key}`);
    return;
  }
  resetRateLimitMemory(key);
}
