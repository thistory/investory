import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
  memoryCache: Map<string, { data: string; expiry: number }> | undefined;
};

// In-memory fallback cache
const memoryCache =
  globalForRedis.memoryCache ?? new Map<string, { data: string; expiry: number }>();
globalForRedis.memoryCache = memoryCache;

let redisAvailable = true;

function createRedis(): Redis | null {
  try {
    const client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 2) {
          redisAvailable = false;
          return null; // stop retrying
        }
        return Math.min(times * 100, 1000);
      },
      lazyConnect: true,
    });

    client.on("error", () => {
      redisAvailable = false;
    });
    client.on("connect", () => {
      redisAvailable = true;
    });

    // Attempt connection but don't block
    client.connect().catch(() => {
      redisAvailable = false;
    });

    return client;
  } catch {
    redisAvailable = false;
    return null;
  }
}

export const redis = globalForRedis.redis ?? createRedis();
if (process.env.NODE_ENV !== "production" && redis)
  globalForRedis.redis = redis;

// Cache helper with automatic in-memory fallback
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    // Try Redis first
    if (redisAvailable && redis) {
      try {
        const data = await redis.get(key);
        if (!data) return null;
        return JSON.parse(data) as T;
      } catch {
        redisAvailable = false;
      }
    }

    // Fallback to memory cache
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiry > 0 && Date.now() > entry.expiry) {
      memoryCache.delete(key);
      return null;
    }
    return JSON.parse(entry.data) as T;
  },

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const data = JSON.stringify(value);

    // Try Redis first
    if (redisAvailable && redis) {
      try {
        if (ttl) {
          await redis.setex(key, ttl, data);
        } else {
          await redis.set(key, data);
        }
        return;
      } catch {
        redisAvailable = false;
      }
    }

    // Fallback to memory cache
    memoryCache.set(key, {
      data,
      expiry: ttl ? Date.now() + ttl * 1000 : 0,
    });
  },

  async del(key: string): Promise<void> {
    if (redisAvailable && redis) {
      try {
        await redis.del(key);
      } catch {
        redisAvailable = false;
      }
    }
    memoryCache.delete(key);
  },
};
