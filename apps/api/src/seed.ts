/**
 * Idempotent seed: roles, first super admin, categories, settings, demo content.
 * Demo projects are flagged isDemo:true; placeholder products stay in draft with unverified specs.
 * Run: npm run seed
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { PRODUCT_CATEGORIES } from '@te/types';
import { DEFAULT_ASSUMPTIONS } from '@te/solar-engine';
import { env } from './config/env.js';
import { Category, Product, Project, RoleModel, SiteSetting, Solution, User } from './models/index.js';

const up = <T>(m: mongoose.Model<T>, filter: object, doc: object) =>
  m.updateOne(filter, { $setOnInsert: doc }, { upsert: true });

async function run() {
  await mongoose.connect(env.MONGODB_URI);

  await Promise.all([
    up(RoleModel, { key: 'super_admin' }, { key: 'super_admin', label: 'Super Admin', description: 'Full access including users and roles' }),
    up(RoleModel, { key: 'admin' }, { key: 'admin', label: 'Administrator', description: 'All content, catalog, leads and settings' }),
    up(RoleModel, { key: 'content_editor' }, { key: 'content_editor', label: 'Content Editor', description: 'Products, solutions, projects, articles' }),
    up(RoleModel, { key: 'sales_manager' }, { key: 'sales_manager', label: 'Sales Manager', description: 'Inquiries, quotations, calculator leads' }),
  ]);

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@techexpertenergy.com';
  const pass = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!2026';
  if (!(await User.exists({ email }))) {
    await User.create({ name: 'Super Admin', email, role: 'super_admin', passwordHash: await bcrypt.hash(pass, 12) });
    console.log(`Created super admin ${email} — change the password after first login.`);
  }

  await Promise.all(
    PRODUCT_CATEGORIES.map((c, i) => up(Category, { slug: c.slug }, { name: c.name, slug: c.slug, group: c.group, order: i })),
  );

  await Promise.all([
    up(SiteSetting, { key: 'calculator.assumptions' }, { key: 'calculator.assumptions', value: DEFAULT_ASSUMPTIONS, public: true }),
    up(SiteSetting, { key: 'contact' }, {
      key: 'contact',
      public: true,
      value: { email: 'info@techexpertenergy.com', phone: '+880 1XXX-XXXXXX', whatsapp: '8801XXXXXXXXX', address: 'Dhaka, Bangladesh' },
    }),
  ]);

  const solutions = [
    ['Commercial & Industrial Solar', 'commercial-industrial-solar', 'commercial-industrial'],
    ['Residential Solar', 'residential-solar', 'residential'],
    ['Battery Energy Storage Systems', 'battery-energy-storage', 'bess'],
    ['Solar Operation & Maintenance', 'solar-operation-maintenance', 'om'],
    ['Smart Energy Management System', 'smart-energy-management', 'ems'],
    ['Industrial IoT Solutions', 'industrial-iot', 'iot'],
  ] as const;
  await Promise.all(solutions.map(([title, slug, segment], i) => up(Solution, { slug }, { title, slug, segment, order: i, status: 'published' })));

  const demo = [
    { title: 'Garment factory rooftop (demo)', slug: 'demo-garment-rooftop', industry: 'garments-textile', projectType: 'rooftop', capacityKwp: 1200, location: 'Gazipur' },
    { title: 'Cold storage hybrid system (demo)', slug: 'demo-cold-storage-hybrid', industry: 'agriculture-cold-storage', projectType: 'hybrid', capacityKwp: 250, location: 'Bogura' },
    { title: 'Hospital BESS backup (demo)', slug: 'demo-hospital-bess', industry: 'healthcare', projectType: 'bess', capacityKwp: 300, location: 'Dhaka' },
  ];
  await Promise.all(demo.map((p) => up(Project, { slug: p.slug }, { ...p, isDemo: true, status: 'published', technologies: ['PV', 'Inverter', 'EMS'] })));

  await up(Product, { slug: 'placeholder-hybrid-inverter' }, {
    name: 'Hybrid Inverter (placeholder)',
    model: 'TBD',
    slug: 'placeholder-hybrid-inverter',
    category: 'hybrid-inverters',
    summary: 'Placeholder listing. Replace with a verified product and datasheet from the admin dashboard.',
    specs: [{ label: 'Rated power', value: 'Pending datasheet', verified: false }],
    status: 'draft',
  });

  console.log('Seed complete');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
