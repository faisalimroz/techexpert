import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  calculatorSchema,
  inquirySchema,
  listQuery,
  loginSchema,
  productSchema,
  productUpdateSchema,
  quotationSchema,
  userCreateSchema,
} from '@te/validation';
import { estimateSolar, ESTIMATE_DISCLAIMER, type Assumptions } from '@te/solar-engine';
import { env, isProd } from '../config/env.js';
import { AppError, ah } from '../lib/http.js';
import { AUTH_COOKIE, CSRF_COOKIE, can, requireAuth, validate } from '../middleware/core.js';
import {
  AuditLog, BlogPost, Brand, Category, Inquiry, Product, Project, Quotation, SiteSetting, SolarCalculation, Solution, User,
} from '../models/index.js';
import { audit, crudRouter, notifySales, simulateDay, simulateSnapshot } from '../services/index.js';

export const api = Router();

const formLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });

api.get('/health', (_req, res) => res.json({ ok: true, service: 'techexpert-energy-api', time: new Date().toISOString() }));

// ---------------- Auth ----------------
const cookieBase = { secure: isProd, sameSite: 'strict' as const, domain: env.COOKIE_DOMAIN || undefined, path: '/' };

api.post(
  '/auth/login',
  loginLimiter,
  validate(loginSchema),
  ah(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await User.findOne({ email: email.toLowerCase(), active: true }).select('+passwordHash +failedLogins +lockedUntil');
    const invalid = new AppError(401, 'invalid_credentials', 'Email or password is incorrect');
    if (!user) {
      await bcrypt.compare(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv'); // timing parity
      throw invalid;
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) throw new AppError(423, 'locked', 'Account temporarily locked. Try again in 15 minutes.');
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      user.failedLogins = (user.failedLogins ?? 0) + 1;
      if (user.failedLogins >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60_000);
        user.failedLogins = 0;
      }
      await user.save();
      throw invalid;
    }
    user.failedLogins = 0;
    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign({ role: user.role, email: user.email }, env.JWT_SECRET, {
      subject: String(user._id),
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
    });
    const csrf = crypto.randomBytes(24).toString('hex');
    res.cookie(AUTH_COOKIE, token, { ...cookieBase, httpOnly: true, maxAge: 8 * 3600_000 });
    res.cookie(CSRF_COOKIE, csrf, { ...cookieBase, httpOnly: false, maxAge: 8 * 3600_000 });
    req.user = { id: String(user._id), role: user.role, email: user.email };
    await audit(req, 'auth.login', 'User', String(user._id));
    res.json({ user: user.toJSON() });
  }),
);

api.post('/auth/logout', (_req, res) => {
  res.clearCookie(AUTH_COOKIE, cookieBase).clearCookie(CSRF_COOKIE, cookieBase).status(204).end();
});

api.get(
  '/auth/me',
  requireAuth,
  ah(async (req, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw AppError.unauthorized();
    res.json({ user: user.toJSON() });
  }),
);

// ---------------- Users (super admin) ----------------
api.get('/users', can('users:manage'), ah(async (_req, res) => res.json({ items: (await User.find().sort('-createdAt')).map((u) => u.toJSON()) })));
api.post(
  '/users',
  can('users:manage'),
  validate(userCreateSchema),
  ah(async (req, res) => {
    const { password, ...rest } = req.body as z.infer<typeof userCreateSchema>;
    const user = await User.create({ ...rest, passwordHash: await bcrypt.hash(password, 12) });
    await audit(req, 'user.create', 'User', String(user._id), { role: rest.role });
    res.status(201).json(user.toJSON());
  }),
);
api.patch(
  '/users/:id',
  can('users:manage'),
  validate(z.object({ role: userCreateSchema.shape.role.optional(), active: z.boolean().optional(), name: z.string().min(2).optional() })),
  ah(async (req, res) => {
    if (req.params.id === req.user!.id && req.body.role && req.body.role !== 'super_admin')
      throw new AppError(400, 'self_demote', 'You cannot remove your own super admin role');
    const u = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!u) throw AppError.notFound('User');
    await audit(req, 'user.update', 'User', req.params.id, req.body);
    res.json(u.toJSON());
  }),
);

// ---------------- Catalog & content (generic CRUD) ----------------
const slugDoc = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), status: z.enum(['draft', 'published', 'archived']).optional() }).passthrough();

api.use('/products', crudRouter({ model: Product, entity: 'Product', writePerm: 'products:write', create: productSchema, update: productUpdateSchema, searchFields: ['name', 'model', 'summary'], populate: 'brand' }));
api.use('/categories', crudRouter({ model: Category, entity: 'Category', writePerm: 'catalog:write', create: slugDoc, update: slugDoc.partial(), publicFilter: {} }));
api.use('/brands', crudRouter({ model: Brand, entity: 'Brand', writePerm: 'catalog:write', create: slugDoc, update: slugDoc.partial(), searchFields: ['name'] }));
api.use('/solutions', crudRouter({ model: Solution, entity: 'Solution', writePerm: 'content:write', create: slugDoc, update: slugDoc.partial(), searchFields: ['title'] }));
api.use('/projects', crudRouter({ model: Project, entity: 'Project', writePerm: 'content:write', create: slugDoc, update: slugDoc.partial(), searchFields: ['title', 'location', 'industry'] }));
api.use('/blogs', crudRouter({ model: BlogPost, entity: 'BlogPost', writePerm: 'content:write', create: slugDoc, update: slugDoc.partial(), searchFields: ['title', 'excerpt'] }));

// ---------------- Leads ----------------
api.post(
  '/inquiries',
  formLimiter,
  validate(inquirySchema),
  ah(async (req, res) => {
    const b = req.body as z.infer<typeof inquirySchema>;
    if (b.website) return res.status(202).json({ ok: true }); // honeypot: pretend success
    const doc = await Inquiry.create({
      ...b,
      products: b.productIds,
      calculation: b.calculationId,
      meta: { ip: req.ip, userAgent: req.get('user-agent'), referrer: req.get('referer') },
    });
    void notifySales(`New ${b.type} inquiry — ${b.name}${b.company ? ` (${b.company})` : ''}`, `${b.email} · ${b.phone}\n${b.location}\n${b.powerRequirement ?? ''}\n\n${b.message ?? ''}`);
    res.status(201).json({ ok: true, id: String(doc._id) });
  }),
);
api.get('/inquiries', can('leads:read'), validate(listQuery, 'query'), ah(async (req, res) => {
  const q = req.query as unknown as { page: number; limit: number; status?: string };
  const filter = q.status ? { status: q.status } : {};
  const [items, total] = await Promise.all([
    Inquiry.find(filter).sort('-createdAt').skip((q.page - 1) * q.limit).limit(q.limit),
    Inquiry.countDocuments(filter),
  ]);
  res.json({ items: items.map((i) => i.toJSON()), page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) });
}));
api.patch(
  '/inquiries/:id',
  can('leads:write'),
  validate(z.object({ status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'spam']).optional(), assignedTo: z.string().optional(), note: z.string().max(2000).optional() })),
  ah(async (req, res) => {
    const { note, ...set } = req.body;
    const update: Record<string, unknown> = { $set: set };
    if (note) update.$push = { notes: { by: req.user!.id, text: note } };
    const doc = await Inquiry.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) throw AppError.notFound('Inquiry');
    await audit(req, 'inquiry.update', 'Inquiry', req.params.id, req.body);
    res.json(doc.toJSON());
  }),
);

api.get('/quotations', can('leads:read'), ah(async (_req, res) => res.json({ items: (await Quotation.find().sort('-createdAt').limit(100)).map((q) => q.toJSON()) })));
api.post(
  '/quotations',
  can('leads:write'),
  validate(quotationSchema),
  ah(async (req, res) => {
    const b = req.body as z.infer<typeof quotationSchema>;
    const totalBdt = b.items.reduce((s, i) => s + i.qty * (i.unitPriceBdt ?? 0), 0);
    const year = new Date().getFullYear();
    const seq = (await Quotation.countDocuments({ number: new RegExp(`^TEE-${year}-`) })) + 1;
    const doc = await Quotation.create({
      ...b,
      inquiry: b.inquiryId,
      items: b.items.map((i) => ({ ...i, product: i.productId })),
      totalBdt,
      number: `TEE-${year}-${String(seq).padStart(4, '0')}`,
      createdBy: req.user!.id,
    });
    await audit(req, 'quotation.create', 'Quotation', String(doc._id));
    res.status(201).json(doc.toJSON());
  }),
);

// ---------------- Solar calculator ----------------
async function calcAssumptions(): Promise<Partial<Assumptions>> {
  const s = await SiteSetting.findOne({ key: 'calculator.assumptions' }).lean().catch(() => null);
  return (s?.value as Partial<Assumptions>) ?? {};
}

api.post(
  '/solar-calculator',
  formLimiter,
  validate(calculatorSchema),
  ah(async (req, res) => {
    const { contact, ...input } = req.body as z.infer<typeof calculatorSchema>;
    const result = estimateSolar(input, await calcAssumptions());
    const doc = await SolarCalculation.create({
      input, result, contact, location: input.location, systemType: input.systemType, installedKwp: result.installedKwp,
      meta: { ip: req.ip, userAgent: req.get('user-agent') },
    });
    res.status(201).json({ id: String(doc._id), result, disclaimer: ESTIMATE_DISCLAIMER });
  }),
);
api.get('/solar-calculator', can('leads:read'), validate(listQuery, 'query'), ah(async (req, res) => {
  const q = req.query as unknown as { page: number; limit: number };
  const [items, total] = await Promise.all([
    SolarCalculation.find().sort('-createdAt').skip((q.page - 1) * q.limit).limit(q.limit),
    SolarCalculation.countDocuments(),
  ]);
  res.json({ items: items.map((i) => i.toJSON()), page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) });
}));

// ---------------- Energy monitoring (demo until devices connect) ----------------
api.get('/energy-monitoring/demo/snapshot', (_req, res) => res.json(simulateSnapshot()));
api.get('/energy-monitoring/demo/day', (_req, res) => {
  res.json({ simulated: true, interval: '15m', points: simulateDay() });
});

// ---------------- Settings & audit ----------------
api.get('/settings/public', ah(async (_req, res) => {
  const rows = await SiteSetting.find({ public: true }).lean();
  res.set('Cache-Control', 'public, max-age=300');
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}));
api.put(
  '/settings/:key',
  can('settings:write'),
  validate(z.object({ value: z.unknown(), public: z.boolean().optional() })),
  ah(async (req, res) => {
    const doc = await SiteSetting.findOneAndUpdate({ key: req.params.key }, req.body, { upsert: true, new: true });
    await audit(req, 'setting.update', 'SiteSetting', req.params.key, req.body);
    res.json(doc.toJSON());
  }),
);
api.get('/audit-logs', can('audit:read'), ah(async (_req, res) => res.json({ items: await AuditLog.find().sort('-createdAt').limit(200).lean() })));
