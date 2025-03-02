import { Context } from 'hono';

// Rate limit constants
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REQUESTS = 50; // Maximum requests per window

interface RateLimitInfo {
  count: number;
  timestamp: number;
}

const rateLimitStore = new Map<string, RateLimitInfo>();

export const rateLimitHandler = () => {
  return async (c: Context, next: () => Promise<void>) => {
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for') ||
      '0.0.0.0';

    const now = Date.now();
    const limitInfo = rateLimitStore.get(ip) || { count: 0, timestamp: now };

    // Reset count if window has passed
    if (now - limitInfo.timestamp > RATE_LIMIT_WINDOW) {
      limitInfo.count = 0;
      limitInfo.timestamp = now;
    }

    if (limitInfo.count >= MAX_REQUESTS) {
      return c.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(
            (limitInfo.timestamp + RATE_LIMIT_WINDOW - now) / 1000
          ),
        },
        429
      );
    }

    limitInfo.count++;
    rateLimitStore.set(ip, limitInfo);

    await next();
  };
};
