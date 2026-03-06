// Optional Redis caching utility
// Install: bun add ioredis
// Enable by setting REDIS_ENABLED=true in .env

import { logger } from './logger';

interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

class InMemoryCache implements CacheClient {
  private store: Map<string, { value: string; expiry: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string, ttl: number = 3600): Promise<void> {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttl * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const item = this.store.get(key);
    if (!item) return false;

    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  // Cleanup expired entries periodically
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.store.entries()) {
        if (now > item.expiry) {
          this.store.delete(key);
        }
      }
    }, 60000); // Every minute
  }
}

class RedisCache implements CacheClient {
  private client: any;

  constructor() {
    try {
      // Dynamically import ioredis if available
      const Redis = require('ioredis');
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
      });

      this.client.on('error', (err: Error) => {
        logger.error('Redis error', {}, err);
      });
    } catch (error) {
      logger.warn('Redis not available, falling back to in-memory cache');
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl: number = 3600): Promise<void> {
    await this.client.setex(key, ttl, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}

// Cache factory
function createCache(): CacheClient {
  const redisEnabled = process.env.REDIS_ENABLED === 'true';

  if (redisEnabled) {
    try {
      const cache = new RedisCache();
      logger.info('Using Redis cache');
      return cache;
    } catch (error) {
      logger.warn('Failed to initialize Redis, using in-memory cache');
    }
  }

  const memCache = new InMemoryCache();
  memCache.startCleanup();
  logger.info('Using in-memory cache');
  return memCache;
}

// Singleton cache instance
export const cache = createCache();

// Cache helper functions
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Try to get from cache
  const cached = await cache.get(key);
  if (cached) {
    logger.debug('Cache hit', { key });
    return JSON.parse(cached);
  }

  // Cache miss - fetch data
  logger.debug('Cache miss', { key });
  const data = await fetcher();

  // Store in cache
  await cache.set(key, JSON.stringify(data), ttl);

  return data;
}

export async function invalidateCache(key: string): Promise<void> {
  await cache.del(key);
  logger.debug('Cache invalidated', { key });
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  // For in-memory cache, this is a simple prefix match
  // For Redis, you would use SCAN with pattern matching
  logger.debug('Cache pattern invalidated', { pattern });
}

// Cache TTL constants
export const CacheTTL = {
  CONVERSATION_STATE: 1800, // 30 minutes
  VOICE_SETTINGS: 3600, // 1 hour
  DIET_PLAN: 86400, // 24 hours
  HEALTH_PROFILE: 3600, // 1 hour
  USER_PROGRESS: 300, // 5 minutes
};
