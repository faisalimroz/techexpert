import mongoose, { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { PRODUCT_CATEGORIES, ROLES } from '@te/types';
import { MediaSchema, SeoSchema, STATUS, toJSON } from './shared.js';

const opts = { timestamps: true, toJSON } as const;
const ref = (name: string) => ({ type: Schema.Types.ObjectId, ref: name });

// ---------------- Identity ----------------
const RoleSchema = new Schema(
  {
    key: { type: String, enum: ROLES, unique: true, required: true },
    label: { type: String, required: true },
    description: String,
  },
  opts,
);
export const RoleModel = model('Role', RoleSchema);

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: 'content_editor', index: true },
    active: { type: Boolean, default: true },
    lastLoginAt: Date,
    failedLogins: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, select: false },
  },
  opts,
);
export type UserDoc = InferSchemaType<typeof UserSchema>;
export const User = model('User', UserSchema);

// ---------------- Catalog ----------------
const BrandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    logo: MediaSchema,
    website: String,
    /** true only after a signed distribution/partner agreement exists */
    authorizedPartner: { type: Boolean, default: false },
    status: { type: String, enum: STATUS, default: 'draft', index: true },
  },
  opts,
);
export const Brand = model('Brand', BrandSchema);

const CategorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, enum: PRODUCT_CATEGORIES.map((c) => c.slug) },
    group: { type: String, required: true },
    description: String,
    image: MediaSchema,
    order: { type: Number, default: 0 },
    seo: SeoSchema,
  },
  opts,
);
export const Category = model('Category', CategorySchema);

const SpecSchema = new Schema(
  { label: { type: String, required: true }, value: { type: String, required: true }, unit: String, verified: { type: Boolean, default: false } },
  { _id: false },
);
const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    brand: ref('Brand'),
    category: { type: String, required: true, enum: PRODUCT_CATEGORIES.map((c) => c.slug), index: true },
    summary: { type: String, default: '' },
    images: { type: [MediaSchema], default: [] },
    specs: { type: [SpecSchema], default: [] },
    features: { type: [String], default: [] },
    applications: { type: [String], default: [] },
    datasheetUrl: String,
    warranty: String,
    related: [ref('Product')],
    status: { type: String, enum: STATUS, default: 'draft', index: true },
    publishedAt: Date,
    seo: SeoSchema,
    createdBy: ref('User'),
    updatedBy: ref('User'),
  },
  opts,
);
ProductSchema.index({ status: 1, category: 1, createdAt: -1 });
ProductSchema.index({ name: 'text', model: 'text', summary: 'text' });
ProductSchema.pre('save', function (this: mongoose.Document & { status?: string; publishedAt?: Date | null }, next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) this.publishedAt = new Date();
  next();
});
export const Product = model('Product', ProductSchema);

// ---------------- Content ----------------
const SolutionSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    segment: { type: String, enum: ['commercial-industrial', 'residential', 'bess', 'om', 'iot', 'ems'], required: true, index: true },
    summary: String,
    body: String, // MDX/markdown from CMS
    benefits: [String],
    heroImage: MediaSchema,
    order: { type: Number, default: 0 },
    status: { type: String, enum: STATUS, default: 'draft', index: true },
    seo: SeoSchema,
  },
  opts,
);
export const Solution = model('Solution', SolutionSchema);

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    industry: { type: String, required: true, index: true },
    projectType: { type: String, enum: ['rooftop', 'ground-mount', 'hybrid', 'bess', 'iot-ems', 'street-lighting'], index: true },
    capacityKwp: { type: Number, index: true },
    location: String,
    technologies: [String],
    annualGenerationKwh: Number,
    benefits: [String],
    testimonial: { quote: String, author: String, role: String },
    images: [MediaSchema],
    /** sample content must stay flagged until a real reference replaces it */
    isDemo: { type: Boolean, default: false },
    status: { type: String, enum: STATUS, default: 'draft', index: true },
    seo: SeoSchema,
  },
  opts,
);
export const Project = model('Project', ProjectSchema);

const BlogPostSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: String,
    body: String,
    cover: MediaSchema,
    tags: { type: [String], index: true },
    author: ref('User'),
    status: { type: String, enum: STATUS, default: 'draft', index: true },
    publishedAt: { type: Date, index: true },
    seo: SeoSchema,
  },
  opts,
);
export const BlogPost = model('BlogPost', BlogPostSchema);

const SiteSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: Schema.Types.Mixed,
    /** public settings are served to the website; others are admin-only */
    public: { type: Boolean, default: false },
  },
  opts,
);
export const SiteSetting = model('SiteSetting', SiteSettingSchema);

// ---------------- Leads ----------------
const LEAD_STATUS = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'spam'] as const;
const InquirySchema = new Schema(
  {
    type: { type: String, enum: ['consultation', 'quotation', 'technical-meeting', 'site-assessment', 'sales'], required: true, index: true },
    name: { type: String, required: true },
    company: String,
    email: { type: String, required: true, lowercase: true, index: true },
    phone: { type: String, required: true },
    location: String,
    powerRequirement: String,
    message: String,
    products: [ref('Product')],
    calculation: ref('SolarCalculation'),
    status: { type: String, enum: LEAD_STATUS, default: 'new', index: true },
    assignedTo: ref('User'),
    notes: [{ by: ref('User'), text: String, at: { type: Date, default: Date.now } }],
    meta: { ip: String, userAgent: String, referrer: String },
  },
  opts,
);
InquirySchema.index({ createdAt: -1 });
export const Inquiry = model('Inquiry', InquirySchema);

const QuotationSchema = new Schema(
  {
    number: { type: String, required: true, unique: true },
    inquiry: ref('Inquiry'),
    customer: { name: String, company: String, email: String, phone: String },
    items: [{ product: ref('Product'), description: String, qty: Number, unitPriceBdt: Number, _id: false }],
    totalBdt: Number,
    notes: String,
    validUntil: Date,
    status: { type: String, enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'], default: 'draft', index: true },
    createdBy: ref('User'),
  },
  opts,
);
export const Quotation = model('Quotation', QuotationSchema);

const SolarCalculationSchema = new Schema(
  {
    input: { type: Schema.Types.Mixed, required: true },
    result: { type: Schema.Types.Mixed, required: true },
    location: { type: String, index: true },
    systemType: String,
    installedKwp: { type: Number, index: true },
    contact: { name: String, email: String, phone: String },
    reviewed: { type: Boolean, default: false, index: true },
    meta: { ip: String, userAgent: String },
  },
  opts,
);
SolarCalculationSchema.index({ createdAt: -1 });
export const SolarCalculation = model('SolarCalculation', SolarCalculationSchema);

// ---------------- IoT / EMS ----------------
const IotDeviceSchema = new Schema(
  {
    name: { type: String, required: true },
    kind: { type: String, enum: ['inverter', 'smart-meter', 'bess', 'gateway', 'sensor', 'ev-charger'], required: true },
    siteId: { type: String, required: true, index: true },
    protocol: { type: String, enum: ['modbus-tcp', 'modbus-rtu', 'mqtt', 'vendor-api'], required: true },
    address: String, // host:port / topic / unit id
    vendor: String,
    model: String,
    active: { type: Boolean, default: true },
    lastSeenAt: Date,
  },
  opts,
);
export const IotDevice = model('IotDevice', IotDeviceSchema);

/** MongoDB time-series collection; one doc per device per sample. */
const EnergyReadingSchema = new Schema(
  {
    ts: { type: Date, required: true },
    meta: { deviceId: { type: Schema.Types.ObjectId, required: true }, siteId: String, kind: String },
    solarKw: Number,
    loadKw: Number,
    gridImportKw: Number,
    gridExportKw: Number,
    batteryKw: Number,
    batterySocPct: Number,
    energyKwh: Number,
    voltage: Number,
    frequencyHz: Number,
    alarms: [String],
  },
  {
    timeseries: { timeField: 'ts', metaField: 'meta', granularity: 'minutes' },
    expireAfterSeconds: 60 * 60 * 24 * 365 * 3, // raw retention 3y; roll-ups kept separately
    autoCreate: true,
  },
);
export const EnergyReading = model('EnergyReading', EnergyReadingSchema);

// ---------------- Audit ----------------
const AuditLogSchema = new Schema(
  {
    actor: ref('User'),
    action: { type: String, required: true }, // e.g. product.update
    entity: { type: String, required: true, index: true },
    entityId: { type: String, index: true },
    diff: Schema.Types.Mixed,
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON },
);
AuditLogSchema.index({ createdAt: -1 });
export const AuditLog = model('AuditLog', AuditLogSchema);

export type AnyModel = Model<any>;
