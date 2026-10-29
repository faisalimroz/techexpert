import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ZodError, type ZodTypeAny } from 'zod';
import { PERMISSIONS, type Permission, type Role } from '@te/types';
import { env } from '../config/env.js';
import { AppError, logger } from '../lib/http.js';

export const AUTH_COOKIE = 'te_session';
export const CSRF_COOKIE = 'te_csrf';
export const CSRF_HEADER = 'x-te-csrf';

export interface AuthUser {
  id: string;
  role: Role;
  email: string;
}
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Reads the HTTP-only JWT cookie. Never accepts tokens from query strings. */
export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (token) {
    try {
      const p = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
      req.user = { id: String(p.sub), role: p.role as Role, email: String(p.email) };
    } catch {
      /* expired/invalid → anonymous */
    }
  }
  next();
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) =>
  req.user ? next() : next(AppError.unauthorized());

/** Backend-enforced RBAC. */
export const can =
  (perm: Permission) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    const allowed = PERMISSIONS[perm] as readonly Role[];
    return allowed.includes(req.user.role) ? next() : next(AppError.forbidden());
  };

/** Double-submit CSRF check for cookie-authenticated, state-changing requests. */
export function csrfGuard(req: Request, _res: Response, next: NextFunction) {
  const safe = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (safe || !req.cookies?.[AUTH_COOKIE]) return next();
  const header = req.get(CSRF_HEADER);
  if (header && header === req.cookies?.[CSRF_COOKIE]) return next();
  return next(new AppError(403, 'csrf', 'Missing or invalid CSRF token'));
}

type Part = 'body' | 'query' | 'params';
export const validate =
  (schema: ZodTypeAny, part: Part = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const r = schema.safeParse(req[part]);
    if (!r.success) return next(r.error);
    // express 4 lets us replace query; keep parsed (coerced, defaulted) values
    (req as unknown as Record<Part, unknown>)[part] = r.data;
    next();
  };

export const notFound = (req: Request, _res: Response, next: NextFunction) =>
  next(new AppError(404, 'not_found', `No route for ${req.method} ${req.path}`));

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(422).json({ error: { code: 'validation', message: 'Check the highlighted fields', details: err.flatten() } });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err?.name === 'CastError') return res.status(400).json({ error: { code: 'bad_id', message: 'Invalid id' } });
  if (err?.code === 11000) return res.status(409).json({ error: { code: 'duplicate', message: 'Already exists', details: err.keyValue } });
  if (err instanceof RangeError) return res.status(422).json({ error: { code: 'validation', message: err.message } });
  logger.error({ err, path: req.path }, 'unhandled');
  return res.status(500).json({ error: { code: 'internal', message: 'Something went wrong on our side. Please try again.' } });
};
