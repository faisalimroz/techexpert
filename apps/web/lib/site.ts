import { PRODUCT_CATEGORIES } from '@te/types';

export const SITE = {
  name: 'TechExpert Energy',
  slogan: 'Clean Energy. Smart Technology. A Brighter Tomorrow.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '',
  // Placeholders until the business confirms them (also editable in Admin → Site Settings)
  contact: { email: 'info@techexpertenergy.com', phone: '+880 1XXX-XXXXXX', address: 'Dhaka, Bangladesh' },
};

/** Prefix public assets so the static preview works from any base path. */
export const asset = (p: string) => `${process.env.NEXT_PUBLIC_ASSET_BASE ?? ''}${p}`;
/** Internal links; static preview has no server routing so keep them hash-safe there. */
export const href = (p: string) => (process.env.NEXT_PUBLIC_ASSET_BASE === '.' && p.startsWith('/') && !p.startsWith('/#') ? `.${p}` : p);

export interface MegaGroup {
  title: string;
  links: { label: string; href: string; note?: string }[];
}
export interface NavItem {
  label: string;
  href: string;
  mega?: MegaGroup[];
}

export const NAV: NavItem[] = [
  { label: 'About', href: '/about/' },
  {
    label: 'Solutions',
    href: '/solutions/',
    mega: [
      {
        title: 'Solar Energy',
        links: [
          { label: 'Commercial & Industrial Solar', href: '/solutions/#commercial-industrial', note: 'Rooftop, ground-mount, grid-tied, hybrid' },
          { label: 'Residential Solar', href: '/solutions/#residential', note: 'Hybrid inverters, home backup, monitoring' },
          { label: 'Solar Operation & Maintenance', href: '/solutions/#om', note: 'Cleaning, predictive maintenance, alerts' },
        ],
      },
      {
        title: 'Storage & Intelligence',
        links: [
          { label: 'Battery Energy Storage (BESS)', href: '/bess/', note: 'Peak shaving, backup, solar integration' },
          { label: 'Smart Energy Management', href: '/energy-management/', note: 'Live EMS dashboards and analytics' },
          { label: 'Industrial IoT Solutions', href: '/industrial-iot/', note: 'Meters, gateways, Modbus and MQTT' },
        ],
      },
      {
        title: 'Plan',
        links: [
          { label: 'Solar Power Calculator', href: '/calculator/', note: 'Size a system in a minute' },
          { label: 'Request a Quotation', href: '/quotation/' },
        ],
      },
    ],
  },
  {
    label: 'Products',
    href: '/products/',
    mega: [
      { title: 'Generation & Conversion', links: PRODUCT_CATEGORIES.filter((c) => ['generation', 'conversion'].includes(c.group)).map((c) => ({ label: c.name, href: `/products/?category=${c.slug}` })) },
      { title: 'Storage', links: PRODUCT_CATEGORIES.filter((c) => c.group === 'storage').map((c) => ({ label: c.name, href: `/products/?category=${c.slug}` })) },
      { title: 'Monitoring & IoT', links: PRODUCT_CATEGORIES.filter((c) => c.group === 'iot').map((c) => ({ label: c.name, href: `/products/?category=${c.slug}` })) },
      { title: 'Mobility & BOS', links: PRODUCT_CATEGORIES.filter((c) => ['mobility', 'bos'].includes(c.group)).map((c) => ({ label: c.name, href: `/products/?category=${c.slug}` })) },
    ],
  },
  { label: 'Smart EMS', href: '/energy-management/' },
  { label: 'Industries', href: '/industries/' },
  { label: 'Projects', href: '/projects/' },
  { label: 'Insights', href: '/insights/' },
  { label: 'Contact', href: '/contact/' },
];

/** Every route in the App Router (Phase 2 fills the inner pages). */
export const PAGES: Record<string, { title: string; description: string; phase: number }> = {
  about: { title: 'About TechExpert Energy', description: 'Who we are, how we engineer, and the team behind our solar and IoT projects.', phase: 2 },
  solutions: { title: 'Solar Energy Solutions', description: 'Commercial and industrial solar, residential solar, BESS and operation & maintenance.', phase: 2 },
  products: { title: 'Solar Products', description: 'Panels, inverters, batteries, BESS, smart meters, IoT gateways and EV chargers.', phase: 2 },
  'energy-management': { title: 'Smart Energy Management System', description: 'Real-time visibility and control of solar, grid, battery and loads.', phase: 6 },
  'industrial-iot': { title: 'Industrial IoT Solutions', description: 'Smart meters, sensors and gateways over Modbus TCP/RTU and MQTT.', phase: 6 },
  bess: { title: 'Battery Energy Storage Systems', description: 'Lithium storage for peak shaving, backup power and solar integration.', phase: 2 },
  industries: { title: 'Industries We Serve', description: 'Garments, manufacturing, healthcare, hotels, agriculture, government and more.', phase: 2 },
  projects: { title: 'Projects & Case Studies', description: 'Solar, storage and EMS installations with capacity, technology and results.', phase: 2 },
  calculator: { title: 'Solar Power Calculator', description: 'Estimate system size, generation, savings and payback for your site.', phase: 5 },
  insights: { title: 'News & Insights', description: 'Solar policy, technology and energy efficiency updates for Bangladesh.', phase: 2 },
  contact: { title: 'Contact Us', description: 'Talk to our engineers and sales team.', phase: 5 },
  quotation: { title: 'Request a Quotation', description: 'Send your requirements for a detailed proposal.', phase: 5 },
};
