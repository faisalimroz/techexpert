import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PAGES, asset, href } from '@/lib/site';

/**
 * Route shell for every inner page so navigation works today.
 * Phase 2+ replaces each with its own app/<route>/page.tsx (static or ISR from the API).
 */
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = PAGES[slug];
  return p ? { title: p.title, description: p.description, alternates: { canonical: `/${slug}/` } } : {};
}

export default async function InnerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PAGES[slug];
  if (!p) notFound();
  return (
    <>
      <section className="relative isolate overflow-hidden bg-tech pb-20 pt-[calc(150px+env(safe-area-inset-top,0px))] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset('/images/hero-solar-farm-sunrise.webp')} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-tech via-tech/80 to-transparent" />
        <div className="shell">
          <nav aria-label="Breadcrumb" className="mb-6 font-mono text-[12px] uppercase tracking-widest text-white/60">
            <a href={href('/')} className="hover:text-white">Home</a> <span aria-hidden="true">/</span> {p.title}
          </nav>
          <h1 className="max-w-[18ch] font-display text-display-lg font-extrabold">{p.title}</h1>
          <p className="mt-5 max-w-[60ch] text-lg text-white/80">{p.description}</p>
        </div>
      </section>
      <section className="py-20">
        <div className="shell">
          <div className="card max-w-3xl p-8">
            <p className="eyebrow">In development · Phase {p.phase}</p>
            <h2 className="mt-3 font-display text-2xl font-bold" style={{ color: 'var(--head)' }}>This page is being built on the same design system.</h2>
            <p className="muted mt-3">Its content will be managed from the admin dashboard. Meanwhile, the homepage covers this topic.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={href('/')} className="inline-flex h-11 items-center rounded-full bg-forest px-6 font-semibold text-white">Back to homepage</a>
              <a href={href('/#contact')} className="inline-flex h-11 items-center rounded-full border border-[var(--line)] px-6 font-semibold">Contact our team</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
