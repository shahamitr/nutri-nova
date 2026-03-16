import { Context, Next } from 'hono';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // Clean up every minute

/**
 * Rate limiting middleware factory
 */
export const rateLimit = (options: {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (c: Context) => string;
}) => {
  const { maxRequests, windowMs, keyGenerator } = options;

  return async (c: Context, next: Next) => {
    // Generate key (default: IP address)
    const key = keyGenerator
      ? keyGenerator(c)
      : c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    const now = Date.now();
    const record = store[key];

    if (!record || record.resetTime < now) {
      // Create new record
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      await next();
      return;
    }

    if (record.count >= maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return c.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter,
        },
        429
      );
    }

    // Increment count
    record.count++;
    await next();
  };
};

/**
 * Rate limiter for login endpoint (5 attempts per 15 minutes)
 */
export const loginRateLimit = rateLimit({
  maxRequests: parseInt(process.env.RATE_LIMIT_LOGIN || '5'),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  keyGenerator: (c) => {
    // Use email + IP for login attempts
    const body = c.req.raw.body;
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    return `login:${ip}`;
  },
});

/**
 * Rate limiter for signup endpoint
 */
export const signupRateLimit = rateLimit({
  maxRequests: parseInt(process.env.RATE_LIMIT_SIGNUP || '3'),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
});

/**
 * Rate limiter for TOTP verification (10 attempts per 5 minutes)
 */
export const totpRateLimit = rateLimit({
  maxRequests: 10,
  windowMs: 300000, // 5 minutes
});

/**
 * General API rate limiter (100 requests per 15 minutes)
 */
export const apiRateLimit = rateLimit({
  maxRequests: parseInt(process.env.RATE_LIMIT_API || '100'),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
});
