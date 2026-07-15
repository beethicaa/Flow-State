import { Request, Response, NextFunction } from 'express';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const deviceId = req.headers['x-device-id'] as string || 'anonymous';
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 30;

  const record = rateLimitMap.get(deviceId);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(deviceId, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (record.count >= maxRequests) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in an hour.' });
  }

  record.count++;
  next();
}