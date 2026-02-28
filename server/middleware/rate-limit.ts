import type { NextFunction, Request, Response } from 'express';

const RATE_WINDOW_MS = 10_000;
const RATE_MAX_REQUESTS = 50;

type RateEntry = { windowStart: number; count: number };
const buckets = new Map<string, RateEntry>();

function getIdentifier(req: Request): string {
  return req.header('x-device-id') ?? req.ip ?? 'unknown-device';
}

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const id = getIdentifier(req);
  const now = Date.now();
  const current = buckets.get(id);

  if (!current || now - current.windowStart >= RATE_WINDOW_MS) {
    buckets.set(id, { windowStart: now, count: 1 });
    next();
    return;
  }

  if (current.count >= RATE_MAX_REQUESTS) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  current.count += 1;
  next();
}
