'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Quote } from 'lucide-react';
import { cn } from '@te/ui';
import { asset, href } from '@/lib/site';
import { SectionHead } from '../ui';

/** Demonstration content — replaced by admin-managed Projects (isDemo:false) once references exist. */
const DEMO = [
  { title: 'Knit-composite factory rooftop', industry: 'Garments', type: 'Rooftop', kwp: 1200, location: 'Gazipur', tech: ['Rooftop PV', 'String inverters', 'EMS'], gen: 1_620_000, benefit: 'Covers most daytime load on two production sheds', img: '/images/industrial-rooftop-solar.webp' },
  { title: 'Cold storage hybrid system', industry: 'Agriculture', type: 'Hybrid', kwp: 250, location: 'Bogura', tech: ['Hybrid inverter', 'LiFePO₄ BESS'], gen: 340_000, benefit: 'Keeps chambers at temperature through grid outages', img: '' },
  { title: 'Private hospital backup', industry: 'Healthcare', type: 'BESS', kwp: 300, location: 'Dhaka', tech: ['BESS', 'Smart meters', 'EMS'], gen: 405_000, benefit: 'Seamless transfer for ICU and operating theatres', img: '' },
  { title: 'Logistics hub carport', industry: 'Warehouses', type: 'Ground-mount', kwp: 650, location: 'Chattogram', tech: ['Carport PV', 'EV chargers'], gen: 880_000, benefit: 'Shaded parking that also charges the delivery fleet', img: '' },
  { title: 'Villa community solar', industry: 'Residential', type: 'Rooftop', kwp: 90, location: 'Sylhet', tech: ['Hybrid inverters', 'Home batteries'], gen: 118_000, benefit: 'Lights stay on through evening load-shedding', img: '/images/residential-hybrid-kit.webp' },
  { title: 'Upazila street lighting', industry: 'Government', type: 'Street lighting', kwp: 45, location: 'Rajshahi', tech: ['Solar street lights', 'IoT controllers'], gen: 60_000, benefit: 'Remote dimming and fault map for every pole', img: '' },
];

const CAP = [
  { k: 'all', l: 'Any size' },
  { k: 's', l: '< 100 kWp' },
  { k: 'm', l: '100–500 kWp' },
  { k: 'l', l: '> 500 kWp' },
];
const inCap = (k: string, v: number) => k === 'all' || (k === 's' ? v < 100 : k === 'm' ? v >= 100 && v <= 500 : v > 500);

function Select({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { k: string; l: string }[] }) {
  return (
    <label htmlFor={id} className="min-w-[160px] flex-1">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">{label}</span>
      <select id={id} className="field !py-2.5" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.k} value={o.k}>{o.l}</option>
        ))}
      </select>
    </label>
  );
}

export function Projects() {
  const [ind, setInd] = useState('all');
  const [cap, setCap] = useState('all');
  const [type, setType] = useState('all');
  const industries = useMemo(() => [{ k: 'all', l: 'All industries' }, ...[...new Set(DEMO.map((d) => d.industry))].map((x) => ({ k: x, l: x }))], []);
  const types = useMemo(() => [{ k: 'all', l: 'All types' }, ...[...new Set(DEMO.map((d) => d.type))].map((x) => ({ k: x, l: x }))], []);
  const list = DEMO.filter((d) => (ind === 'all' || d.industry === ind) && (type === 'all' || d.type === type) && inCap(cap, d.kwp));

  return (
    <section id="projects" className="bg-[var(--surface)] py-24 md:py-32">
      <div className="shell">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <SectionHead
            className="!mb-0"
            eyebrow="Projects & case studies"
            title="What a finished project looks like."
            lede="The examples below show how we document each installation. They are illustrative until client references are published."
          />
          <span className="demo-badge mt-2">Demonstration projects</span>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Select id="pf-ind" label="Industry" value={ind} onChange={setInd} options={industries} />
          <Select id="pf-cap" label="Capacity" value={cap} onChange={setCap} options={CAP} />
          <Select id="pf-type" label="Project type" value={type} onChange={setType} options={types} />
        </div>

        <motion.ul layout className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {list.map((p, i) => (
              <motion.li key={p.title} layout initial={{ scale: 0.97 }} animate={{ scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="card group flex flex-col overflow-hidden">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {p.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset(p.img)} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className={cn('h-full w-full', ['bg-[linear-gradient(135deg,#075C46,#18A76A_60%,#F5B841)]', 'bg-[linear-gradient(135deg,#102B35,#087DBA_70%,#6EF0AF)]', 'bg-[linear-gradient(135deg,#04392C,#16384A_50%,#F5B841)]'][i % 3])}>
                      <svg viewBox="0 0 160 100" className="h-full w-full opacity-40" aria-hidden="true">
                        {Array.from({ length: 5 }, (_, r) => (
                          <g key={r} transform={`translate(${-8 + r * 6} ${36 + r * 12}) skewX(-28)`}>
                            {Array.from({ length: 9 }, (_, c) => (
                              <rect key={c} x={c * 19} y="0" width="17" height="9" fill="#cfe7ff" opacity={0.5 + ((c + r) % 3) * 0.15} />
                            ))}
                          </g>
                        ))}
                      </svg>
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-tech/80 px-3 py-1 font-mono text-[11px] font-semibold text-white backdrop-blur">{p.kwp.toLocaleString('en-US')} kWp</span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="muted flex items-center gap-1.5 text-[13px]"><MapPin className="h-3.5 w-3.5" />{p.location} · {p.industry} · {p.type}</p>
                  <h3 className="mt-1.5 font-display text-xl font-bold">{p.title}</h3>
                  <p className="muted mt-2 text-[14.5px]">{p.benefit}.</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {p.tech.map((t) => (
                      <li key={t} className="rounded-md bg-[var(--surface-2)] px-2 py-1 text-[12px] font-semibold">{t}</li>
                    ))}
                  </ul>
                  <p className="tnum mt-auto pt-5 font-mono text-[12.5px] text-[var(--muted)]">≈ {(p.gen / 1000).toLocaleString('en-US')} MWh / year (modelled)</p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
        {list.length === 0 && <p className="muted mt-8">No example matches these filters. Clear one to see more.</p>}

        <figure className="mt-12 grid gap-6 rounded-3xl border border-dashed border-[var(--line)] p-8 md:grid-cols-[auto_1fr] md:items-center">
          <Quote className="h-10 w-10 text-sun" />
          <div>
            <blockquote className="font-display text-xl font-semibold leading-snug">Customer testimonials appear here once clients approve their quotes for publication.</blockquote>
            <figcaption className="muted mt-2 text-sm">Managed in Admin → Projects → Testimonial.</figcaption>
          </div>
        </figure>
        <a href={href('/projects/')} className="mt-8 inline-flex font-semibold text-forest underline-offset-4 hover:underline dark:text-[#7fe0b2]">All projects →</a>
      </div>
    </section>
  );
}
