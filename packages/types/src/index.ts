/** Shared domain types for web + api. Keep framework-free. */

export const ROLES = ['super_admin', 'admin', 'content_editor', 'sales_manager'] as const;
export type Role = (typeof ROLES)[number];

/** Permission keys enforced by the API (never trust the UI alone). */
export const PERMISSIONS = {
  'products:write': ['super_admin', 'admin', 'content_editor'],
  'catalog:write': ['super_admin', 'admin', 'content_editor'],
  'content:write': ['super_admin', 'admin', 'content_editor'],
  'leads:read': ['super_admin', 'admin', 'sales_manager'],
  'leads:write': ['super_admin', 'admin', 'sales_manager'],
  'users:manage': ['super_admin'],
  'settings:write': ['super_admin', 'admin'],
  'audit:read': ['super_admin', 'admin'],
} as const satisfies Record<string, readonly Role[]>;
export type Permission = keyof typeof PERMISSIONS;

export const PRODUCT_CATEGORIES = [
  { slug: 'solar-panels', name: 'Solar Panels', group: 'generation' },
  { slug: 'on-grid-inverters', name: 'On-Grid Inverters', group: 'conversion' },
  { slug: 'off-grid-inverters', name: 'Off-Grid Inverters', group: 'conversion' },
  { slug: 'hybrid-inverters', name: 'Hybrid Inverters', group: 'conversion' },
  { slug: 'solar-batteries', name: 'Solar Batteries', group: 'storage' },
  { slug: 'bess', name: 'BESS', group: 'storage' },
  { slug: 'smart-energy-meters', name: 'Smart Energy Meters', group: 'iot' },
  { slug: 'iot-gateways', name: 'IoT Gateways', group: 'iot' },
  { slug: 'energy-sensors', name: 'Energy Sensors', group: 'iot' },
  { slug: 'solar-monitoring-devices', name: 'Solar Monitoring Devices', group: 'iot' },
  { slug: 'ev-chargers', name: 'EV Chargers', group: 'mobility' },
  { slug: 'solar-accessories', name: 'Solar Accessories', group: 'bos' },
] as const;
export type ProductCategorySlug = (typeof PRODUCT_CATEGORIES)[number]['slug'];
export type ProductGroup = (typeof PRODUCT_CATEGORIES)[number]['group'];

export type PublishStatus = 'draft' | 'published' | 'archived';
export type SystemType = 'on-grid' | 'off-grid' | 'hybrid';
export type InquiryType =
  | 'consultation'
  | 'quotation'
  | 'technical-meeting'
  | 'site-assessment'
  | 'sales';

export interface SeoMeta {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
}

export interface MediaRef {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface ProductSpec {
  label: string;
  value: string;
  unit?: string;
  /** false until a verified manufacturer datasheet backs it */
  verified: boolean;
}

export interface ProductDTO {
  id: string;
  name: string;
  model: string;
  slug: string;
  brand?: { id: string; name: string } | null;
  category: ProductCategorySlug;
  summary: string;
  images: MediaRef[];
  specs: ProductSpec[];
  features: string[];
  applications: string[];
  datasheetUrl?: string | null;
  warranty?: string | null;
  relatedIds: string[];
  status: PublishStatus;
  seo?: SeoMeta;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

export interface EnergySnapshot {
  ts: string;
  simulated: boolean;
  solarKw: number;
  loadKw: number;
  gridImportKw: number;
  gridExportKw: number;
  batterySocPct: number;
  batteryKw: number; // + charging, - discharging
}
