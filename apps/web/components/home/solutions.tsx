import { ArrowUpRight, Check } from 'lucide-react';
import { asset, href } from '@/lib/site';
import { Reveal, SectionHead } from '../ui';

const C_I = ['Rooftop solar PV systems', 'Industrial solar power plants', 'Ground-mounted solar systems', 'Grid-connected solar solutions', 'Hybrid solar power systems'];
const RES = ['Smart home solar solutions', 'Hybrid inverters', 'Residential battery backup', 'Intelligent home energy monitoring'];
const BESS = ['Lithium battery storage', 'Commercial energy storage', 'Peak shaving', 'Backup power solutions', 'Solar and battery integration'];
const OM = ['Solar performance monitoring', 'Automated and manual panel cleaning', 'Predictive maintenance', 'Fault detection and alerts'];

function List({ items, dark }: { items: string[]; dark?: boolean }) {
  return (
    <ul className="mt-5 grid gap-2.5">
      {items.map((i) => (
        <li key={i} className="flex items-start gap-2.5 text-[15px]">
          <Check className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? 'text-sun' : 'text-nature'}`} />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

function More({ to, label, dark }: { to: string; label: string; dark?: boolean }) {
  return (
    <a href={href(to)} className={`mt-6 inline-flex items-center gap-1.5 font-semibold ${dark ? 'text-sun' : 'text-forest dark:text-[#7fe0b2]'} group`}>
      {label} <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </a>
  );
}

/** Animated battery: charge level sweeps with a soft shimmer (pure CSS/SVG). */
function BatteryVisual() {
  return (
    <svg viewBox="0 0 320 200" className="h-auto w-full max-w-full" role="img" aria-label="Battery charging illustration">
      <defs>
        <linearGradient id="bfill" x1="0" x2="1">
          <stop offset="0" stopColor="#18A76A" />
          <stop offset="1" stopColor="#6EF0AF" />
        </linearGradient>
        <clipPath id="bclip">
          <rect x="40" y="50" width="220" height="100" rx="14" />
        </clipPath>
      </defs>
      <rect x="32" y="42" width="236" height="116" rx="20" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" />
      <rect x="270" y="80" width="14" height="40" rx="5" fill="currentColor" fillOpacity=".25" />
      <g clipPath="url(#bclip)">
        <rect x="40" y="50" height="100" width="220" fill="url(#bfill)">
          <animate attributeName="width" values="66;198;198;66" keyTimes="0;.55;.85;1" dur="7s" repeatCount="indefinite" />
        </rect>
        <rect x="-60" y="50" width="60" height="100" fill="#fff" opacity=".25" transform="skewX(-20)">
          <animate attributeName="x" from="-60" to="320" dur="2.4s" repeatCount="indefinite" />
        </rect>
      </g>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={95 + i * 55} y1="58" x2={95 + i * 55} y2="142" stroke="currentColor" strokeOpacity=".12" strokeWidth="2" />
      ))}
      <path d="M158 70 l-22 36 h18 l-8 26 24 -38 h-18z" fill="#F5B841" />
    </svg>
  );
}

/** O&M health grid: string-level status with one module flagged. */
function HealthGrid() {
  const cells = Array.from({ length: 48 }, (_, i) => (i === 17 ? 'warn' : i === 33 ? 'clean' : 'ok'));
  return (
    <div className="grid grid-cols-12 gap-1.5" role="img" aria-label="Panel health map with one string needing attention">
      {cells.map((c, i) => (
        <span key={i} className={`aspect-[3/4] rounded-[4px] ${c === 'ok' ? 'bg-ocean/70' : c === 'warn' ? 'animate-pulse bg-sun' : 'bg-nature'}`} />
      ))}
    </div>
  );
}

export function Solutions() {
  return (
    <section id="solutions" className="bg-[var(--surface)] py-24 md:py-32">
      <div className="shell">
        <SectionHead
          eyebrow="Solar energy solutions"
          title="Engineered for factories, homes and everything between."
          lede="Design, supply, installation, commissioning and long-term care under one team, sized to your load profile and the grid rules where you operate."
        />

        <div className="grid gap-5 lg:grid-cols-12">
          <Reveal className="relative overflow-hidden rounded-3xl bg-forest text-white lg:col-span-7 lg:row-span-2">
            <picture>
              <source srcSet={asset('/images/industrial-rooftop-solar.webp')} type="image/webp" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset('/images/industrial-rooftop-solar.jpg')} alt="Large industrial rooftop solar installation across factory buildings" className="absolute inset-0 h-full w-full object-cover transition duration-[1.6s] hover:scale-105" loading="lazy" />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/75 to-transparent" />
            <div className="relative flex h-full min-h-[540px] flex-col justify-end p-8 md:p-10">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-sun">Commercial & Industrial</p>
              <h3 className="mt-2 font-display text-display-md font-extrabold">Commercial & Industrial Solar</h3>
              <p className="mt-3 max-w-[52ch] text-white/80">Cut daytime grid and diesel costs for production floors, warehouses and commercial buildings, with monitoring from day one.</p>
              <div className="grid sm:grid-cols-2">
                <List items={C_I} dark />
              </div>
              <More to="/solutions/#commercial-industrial" label="Explore C&I solar" dark />
            </div>
          </Reveal>

          <Reveal delay={0.08} className="card grid overflow-hidden lg:col-span-5 sm:grid-cols-[1fr_1.1fr] lg:grid-cols-1">
            <picture className="block bg-[#e9e6e2]">
              <source srcSet={asset('/images/residential-hybrid-kit.webp')} type="image/webp" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset('/images/residential-hybrid-kit.jpg')} alt="Wall-mounted home solar kit with panel, hybrid inverter and battery" className="h-full max-h-[260px] w-full object-cover object-[center_40%]" loading="lazy" />
            </picture>
            <div className="p-7">
              <p className="eyebrow">Residential</p>
              <h3 className="mt-2 font-display text-2xl font-bold" style={{ color: 'var(--head)' }}>Residential Solar</h3>
              <List items={RES} />
              <More to="/solutions/#residential" label="Home solar options" />
            </div>
          </Reveal>

          <Reveal delay={0.12} className="card p-7 lg:col-span-5">
            <div className="grid items-center gap-6 sm:grid-cols-[1fr_1fr]">
              <div>
                <p className="eyebrow">Storage</p>
                <h3 className="mt-2 font-display text-2xl font-bold" style={{ color: 'var(--head)' }}>Battery Energy Storage (BESS)</h3>
              </div>
              <div className="text-forest dark:text-[#7fe0b2]">
                <BatteryVisual />
              </div>
            </div>
            <List items={BESS} />
            <More to="/bess/" label="Storage solutions" />
          </Reveal>

          <Reveal delay={0.05} className="card grid gap-8 p-7 md:grid-cols-[1fr_1.1fr] md:items-center lg:col-span-12 md:p-10">
            <div>
              <p className="eyebrow">Operation & Maintenance</p>
              <h3 className="mt-2 font-display text-display-md font-extrabold" style={{ color: 'var(--head)' }}>Solar Operation & Maintenance</h3>
              <p className="muted mt-3 max-w-[52ch]">A plant that is never checked slowly loses output. We watch every string, clean on schedule, and send an engineer before a fault becomes downtime.</p>
              <List items={OM} />
              <More to="/solutions/#om" label="O&M programmes" />
            </div>
            <div className="rounded-2xl bg-tech p-6 text-white">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest text-white/60">String health · Block A</span>
                <span className="demo-badge !text-sun">Example view</span>
              </div>
              <HealthGrid />
              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-ocean/70" />Normal</span>
                <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-sun" />Low output</span>
                <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-nature" />Cleaned today</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
