import { z } from 'zod';
import { PRODUCT_CATEGORIES, ROLES } from '@te/types';

const categorySlugs = PRODUCT_CATEGORIES.map((c) => c.slug) as [string, ...string[]];

/** Bangladesh mobile (01XXXXXXXXX / +8801XXXXXXXXX) or any E.164-ish international number */
export const phone = z
  .string()
  .trim()
  .min(7, 'Enter a phone number')
  .max(20)
  .regex(/^\+?[0-9 ()-]{7,20}$/, 'Use digits, spaces, + or -');

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

// ---------- Leads ----------
export const inquiryTypes = ['consultation', 'quotation', 'technical-meeting', 'site-assessment', 'sales'] as const;

export const inquirySchema = z.object({
  type: z.enum(inquiryTypes),
  name: z.string().trim().min(2, 'Enter your name').max(120),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  email: z.string().trim().email('Enter a valid email').max(160),
  phone,
  location: z.string().trim().min(2, 'Where is the project?').max(160),
  powerRequirement: z.string().trim().max(80).optional().or(z.literal('')),
  message: z.string().trim().max(4000).optional().or(z.literal('')),
  productIds: z.array(objectId).max(20).optional(),
  calculationId: objectId.optional(),
  /** honeypot — must stay empty */
  website: z.string().max(0).optional().or(z.literal('')),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please accept to be contacted' }) }),
});
export type InquiryInput = z.infer<typeof inquirySchema>;

export const quotationItem = z.object({
  productId: objectId.optional(),
  description: z.string().trim().min(1).max(300),
  qty: z.number().positive().max(1_000_000),
  unitPriceBdt: z.number().nonnegative().optional(),
});
export const quotationSchema = z.object({
  inquiryId: objectId.optional(),
  customer: z.object({
    name: z.string().trim().min(2),
    company: z.string().trim().optional(),
    email: z.string().email(),
    phone,
  }),
  items: z.array(quotationItem).min(1).max(200),
  notes: z.string().max(4000).optional(),
  validUntil: z.coerce.date().optional(),
});

// ---------- Calculator ----------
export const calculatorSchema = z
  .object({
    monthlyBillBdt: z.coerce.number().nonnegative().max(1e9).optional(),
    monthlyKwh: z.coerce.number().nonnegative().max(1e8).optional(),
    tariffBdtPerKwh: z.coerce.number().positive().max(100),
    roofSqft: z.coerce.number().nonnegative().max(1e8).optional(),
    panelWatt: z.coerce.number().int().min(100).max(800),
    location: z.enum(['dhaka', 'chattogram', 'rajshahi', 'khulna', 'sylhet', 'rangpur', 'barishal', 'mymensingh']),
    systemType: z.enum(['on-grid', 'off-grid', 'hybrid']),
    offsetPct: z.coerce.number().min(0.1).max(1).optional(),
    contact: z
      .object({ name: z.string().trim().max(120).optional(), email: z.string().email().optional(), phone: phone.optional() })
      .optional(),
  })
  .refine((v) => (v.monthlyKwh ?? 0) > 0 || (v.monthlyBillBdt ?? 0) > 0, {
    message: 'Enter monthly consumption or monthly bill',
    path: ['monthlyKwh'],
  });
export type CalculatorInput = z.infer<typeof calculatorSchema>;

// ---------- Catalog ----------
export const specSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(120),
  unit: z.string().trim().max(20).optional(),
  verified: z.boolean().default(false),
});
export const mediaSchema = z.object({ url: z.string().url(), alt: z.string().max(200).default(''), width: z.number().optional(), height: z.number().optional() });
export const seoSchema = z.object({
  title: z.string().max(70).optional(),
  description: z.string().max(170).optional(),
  ogImage: z.string().url().optional(),
  canonical: z.string().url().optional(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  model: z.string().trim().min(1).max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase-with-dashes'),
  brand: objectId.optional().nullable(),
  category: z.enum(categorySlugs),
  summary: z.string().trim().max(400).default(''),
  images: z.array(mediaSchema).max(20).default([]),
  specs: z.array(specSchema).max(80).default([]),
  features: z.array(z.string().trim().max(200)).max(40).default([]),
  applications: z.array(z.string().trim().max(200)).max(40).default([]),
  datasheetUrl: z.string().url().optional().nullable(),
  warranty: z.string().max(200).optional().nullable(),
  related: z.array(objectId).max(12).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  seo: seoSchema.optional(),
});
export const productUpdateSchema = productSchema.partial();

export const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  category: z.string().max(60).optional(),
  sort: z.string().regex(/^-?[a-zA-Z]+$/).optional(),
});

// ---------- Auth / users ----------
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(200) });
export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  password: z
    .string()
    .min(12, 'At least 12 characters')
    .regex(/[A-Z]/, 'Add an uppercase letter')
    .regex(/[a-z]/, 'Add a lowercase letter')
    .regex(/[0-9]/, 'Add a number'),
  role: z.enum(ROLES),
});

export { z };
