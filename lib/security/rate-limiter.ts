import { headers } from "next/headers";

interface RateLimitRecord {
  timestamps: number[];
}

interface RateLimitOptions {
  key: string;
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

// In-memory sliding window bucket store
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale entries to prevent memory accumulation
const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

function purgeStaleRecords(now: number, maxRetentionMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    const freshTimestamps = record.timestamps.filter(
      (ts) => now - ts < maxRetentionMs
    );
    if (freshTimestamps.length === 0) {
      rateLimitStore.delete(key);
    } else {
      record.timestamps = freshTimestamps;
    }
  }
}

/**
 * Checks and updates rate limit state for a given key using a sliding window algorithm.
 *
 * Characteristics:
 * - In-memory, zero-dependency, zero external cost.
 * - Enforces sliding window rate limits on Next.js server actions.
 * - Prunes stale memory automatically.
 */
export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const { key, maxRequests, windowMs } = options;
  const now = Date.now();

  purgeStaleRecords(now, windowMs * 2);

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps within current window
  const windowStart = now - windowMs;
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Extracts client IP safely from Next.js request headers.
 */
export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    const realIp = headerList.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
    return "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}
