import type { NextFunction, Request, RequestHandler, Response } from 'express';
import pino from 'pino';
import { isProd } from '../config/env.js';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  redact: ['req.headers.cookie', 'req.headers.authorization', '*.password', '*.passwordHash'],
});

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
  static notFound(what = 'Resource') {
    return new AppError(404, 'not_found', `${what} not found`);
  }
  static forbidden(msg = 'You do not have permission for this action') {
    return new AppError(403, 'forbidden', msg);
  }
  static unauthorized(msg = 'Sign in required') {
    return new AppError(401, 'unauthorized', msg);
  }
}

type Async = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
export const ah =
  (fn: Async): RequestHandler =>
  (req, res, next) =>
    fn(req, res, next).catch(next);

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
