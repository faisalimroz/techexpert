import type { Metadata } from 'next';
import { Lock } from 'lucide-react';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

const MODULES = [
  'Overview', 'Products', 'Categories', 'Brands', 'Solutions', 'Projects & Case Studies', 'Blog & Articles', 'Customer Inquiries',
  'Quotations', 'Calculator Leads', 'Media Library', 'SEO', 'Website Content', 'Users & Roles', 'Analytics', 'Site Settings', 'Activity Log',
];

/** Phase 4: replaced by the authenticated dashboard (app/admin/(dashboard)/…) talking to /api with HTTP-only cookies. */
export default function AdminPage() {
  return (
    <section className="min-h-[80vh] bg-[var(--surface-2)] pb-20 pt-[calc(140px+env(safe-area-inset-top,0px))]">
      <div className="shell grid gap-10 lg:grid-cols-[380px_1fr]">
        <div className="card p-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest text-white"><Lock className="h-5 w-5" /></span>
          <h1 className="mt-5 font-display text-2xl font-bold">Admin sign-in</h1>
          <p className="muted mt-2 text-sm">Available in Phase 4. The API already supports login, roles and audit logging.</p>
          <div className="mt-6 grid gap-3 opacity-60">
            <input id="a-email" className="field" placeholder="Email" disabled />
            <input id="a-pass" className="field" placeholder="Password" type="password" disabled />
            <button className="h-11 rounded-full bg-forest font-semibold text-white" disabled>Sign in</button>
          </div>
        </div>
        <div>
          <p className="eyebrow">Planned modules</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {MODULES.map((m) => (
              <li key={m} className="card px-4 py-3 text-[15px] font-semibold">{m}</li>
            ))}
          </ul>
          <p className="muted mt-6 text-sm">Roles: Super Admin, Administrator, Content Editor, Sales Manager. Permissions are enforced by the Express API.</p>
        </div>
      </div>
    </section>
  );
}
