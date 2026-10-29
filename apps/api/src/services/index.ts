import { Router, type Request } from 'express';
import nodemailer from 'nodemailer';
import type { ZodTypeAny } from 'zod';
import { listQuery } from '@te/validation';
import type { Permission } from '@te/types';
import { env } from '../config/env.js';
import { AppError, ah, escapeRegex, logger } from '../lib/http.js';
import { can, validate } from '../middleware/core.js';
import { AuditLog, type AnyModel } from '../models/index.js';

// ---------------- Audit ----------------
export async function audit(req: Request, action: string, entity: string, entityId?: string, diff?: unknown) {
  try {
    await AuditLog.create({ actor: req.user?.id, action, entity, entityId, diff, ip: req.ip });
  } catch (err) {
    logger.warn({ err }, 'audit write failed');
  }
}

// ---------------- Generic CRUD ----------------
interface CrudOptions {
  model: AnyModel;
  entity: string;
  writePerm: Permission;
  create?: ZodTypeAny;
  update?: ZodTypeAny;
  /** fields searched by ?q= */
  searchFields?: string[];
  /** public visitors only see published docs */
  publicFilter?: Record<string, unknown>;
  populate?: string;
  idField?: 'slug' | '_id';
}

/**
 * Public:  GET /           (published only, paginated, ?q ?category ?sort)
 *          GET /:slugOrId
 * Staff:   GET /admin/all, POST /, PATCH /:id, DELETE /:id   (RBAC + audit)
 */
export function crudRouter(o: CrudOptions) {
  const r = Router();
  const pub = o.publicFilter ?? { status: 'published' };

  const list = (filterBase: Record<string, unknown>) =>
    ah(async (req, res) => {
      const q = req.query as unknown as { page: number; limit: number; q?: string; status?: string; category?: string; sort?: string };
      const filter: Record<string, unknown> = { ...filterBase };
      if (q.category) filter.category = q.category;
      if (q.status && !filterBase.status) filter.status = q.status;
      if (q.q && o.searchFields?.length) {
        const rx = new RegExp(escapeRegex(q.q), 'i');
        filter.$or = o.searchFields.map((f) => ({ [f]: rx }));
      }
      const [items, total] = await Promise.all([
        o.model
          .find(filter)
          .sort(q.sort ?? '-createdAt')
          .skip((q.page - 1) * q.limit)
          .limit(q.limit)
          .populate(o.populate ?? '')
          .lean({ virtuals: true }),
        o.model.countDocuments(filter),
      ]);
      res.set('Cache-Control', filterBase === pub ? 'public, max-age=60, stale-while-revalidate=300' : 'no-store');
      res.json({ items: items.map(clean), page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) });
    });

  r.get('/admin/all', can(o.writePerm), validate(listQuery, 'query'), list({}));
  r.get('/', validate(listQuery, 'query'), list(pub));

  r.get(
    '/:key',
    ah(async (req, res) => {
      const key = req.params.key!;
      const byId = /^[a-f\d]{24}$/i.test(key);
      const doc = await o.model
        .findOne({ ...(byId ? { _id: key } : { slug: key }), ...pub })
        .populate(o.populate ?? '')
        .lean({ virtuals: true });
      if (!doc) throw AppError.notFound(o.entity);
      res.json(clean(doc as unknown as Record<string, unknown>));
    }),
  );

  if (o.create)
    r.post(
      '/',
      can(o.writePerm),
      validate(o.create),
      ah(async (req, res) => {
        const doc = await o.model.create({ ...req.body, createdBy: req.user?.id });
        await audit(req, `${o.entity}.create`, o.entity, String(doc._id));
        res.status(201).json(doc.toJSON());
      }),
    );

  if (o.update)
    r.patch(
      '/:id',
      can(o.writePerm),
      validate(o.update),
      ah(async (req, res) => {
        const doc = await o.model.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user?.id }, { new: true, runValidators: true });
        if (!doc) throw AppError.notFound(o.entity);
        await audit(req, `${o.entity}.update`, o.entity, req.params.id, req.body);
        res.json(doc.toJSON());
      }),
    );

  r.delete(
    '/:id',
    can(o.writePerm),
    ah(async (req, res) => {
      const doc = await o.model.findByIdAndDelete(req.params.id);
      if (!doc) throw AppError.notFound(o.entity);
      await audit(req, `${o.entity}.delete`, o.entity, req.params.id);
      res.status(204).end();
    }),
  );

  return r;
}

function clean<T extends Record<string, unknown>>(d: T) {
  const { _id, __v, passwordHash, ...rest } = d as Record<string, unknown>;
  void __v;
  void passwordHash;
  return { id: String(_id), ...rest };
}

// ---------------- Mail ----------------
const transport = env.SMTP_HOST
  ? nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined })
  : null;

export async function notifySales(subject: string, text: string) {
  if (!transport || !env.SALES_NOTIFY_EMAIL) {
    logger.info({ subject }, 'mail skipped (SMTP not configured)');
    return;
  }
  try {
    await transport.sendMail({ from: env.MAIL_FROM, to: env.SALES_NOTIFY_EMAIL, subject, text });
  } catch (err) {
    logger.error({ err }, 'mail failed');
  }
}

// ---------------- EMS simulator ----------------
export { simulateSnapshot, simulateDay } from '@te/solar-engine';
