import { cache } from "../cache/redis";

interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimiterConfig> = {
  finnhub: {
    maxRequests: 60,
    windowMs: 60 * 1000,
  },
  alphaVantage: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
};

export class RateLimiter {
  private provider: string;
  private config: RateLimiterConfig;

  constructor(provider: string) {
    this.provider = provider;
    this.config = RATE_LIMITS[provider] || {
      maxRequests: 100,
      windowMs: 60 * 1000,
    };
  }

  private getKey(): string {
    return `rate_limit:${this.provider}`;
  }

  async canMakeRequest(): Promise<boolean> {
    const key = this.getKey();
    const current = await cache.get<number>(key);
    if (current === null) return true;
    return current < this.config.maxRequests;
  }

  async recordRequest(): Promise<void> {
    const key = this.getKey();
    const current = await cache.get<number>(key);
    const ttl = Math.ceil(this.config.windowMs / 1000);

    if (current === null) {
      await cache.set(key, 1, ttl);
    } else {
      await cache.set(key, current + 1, ttl);
    }
  }
}

export const finnhubLimiter = new RateLimiter("finnhub");
export const alphaVantageLimiter = new RateLimiter("alphaVantage");

export async function withRateLimit<T>(
  limiter: RateLimiter,
  fn: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> {
  if (!(await limiter.canMakeRequest())) {
    if (fallback) {
      return fallback();
    }
    throw new Error("Rate limit exceeded");
  }

  await limiter.recordRequest();
  return fn();
}
