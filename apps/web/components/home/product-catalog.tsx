'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PanelsTopLeft, Zap, Unplug, Combine, BatteryFull, Container, Gauge, Router, Thermometer, MonitorSmartphone, PlugZap, Cable, ArrowUpRight,
} from 'lucide-react';
import type { ProductDTO } from '@te/types';
import { PRODUCT_CATEGORIES } from '@te/types';
import { cn } from '@te/ui';
import { href } from '@/lib/site';
import { SectionHead } from '../ui';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'solar-panels': PanelsTopLeft,
  'on-grid-inverters': Zap,
  'off-grid-inverters': Unplug,
  'hybrid-inverters': Combine,
  'solar-batteries': BatteryFull,
  bess: Container,
  'smart-energy-meters': Gauge,
  'iot-gateways': Router,
  'energy-sensors': Thermometer,
  'solar-monitoring-devices': MonitorSmartphone,
  'ev-chargers': PlugZap,
  'solar-accessories': Cable,
};
const BLURB: Record<string, string> = {
  'solar-panels': 'Monocrystalline modules for rooftops and ground-mount plants.',
  'on-grid-inverters': 'Grid-tied string and central inverters with remote monitoring.',
  'off-grid-inverters': 'Stand-alone power for sites without a reliable grid.',
  'hybrid-inverters': 'Solar, battery and grid in one managed unit.',
  'solar-batteries': 'Lithium storage for homes, shops and offices.',
  bess: 'Containerised and cabinet storage for commercial and industrial sites.',
  'smart-energy-meters': 'Revenue-grade and sub-meters for every feeder.',
  'iot-gateways': 'Edge gateways speaking Modbus TCP/RTU and MQTT.',
  'energy-sensors': 'CT clamps, irradiance, temperature and power quality.',
  'solar-monitoring-devices': 'Data loggers and plant monitoring hardware.',
  'ev-chargers': 'AC and DC charging for fleets, offices and homes.',
  'solar-accessories': 'Mounting structures, cables and protection devices.',
};
const GROUPS = [
  { key: 'all', label: 'All' },
  { key: 'generation', label: 'Generation' },
  { key: 'conversion', label: 'Inverters' },
  { key: 'storage', label: 'Storage' },
  { key: 'iot', label: 'Monitoring & IoT' },
  { key: 'mobility', label: 'EV' },
  { key: 'bos', label: 'Accessories' },
];

export function ProductCatalog({ products }: { products: ProductDTO[] }) {
  const [group, setGroup] = useState('all');
  const cats = useMemo(() => PRODUCT_CATEGORIES.filter((c) => group === 'all' || c.group === group), [group]);
  const counts = useMemo(() => products.reduce<Record<string, number>>((m, p) => ((m[p.category] = (m[p.category] ?? 0) + 1), m), {}), [products]);

  return (
    <section id="products" className="py-24 md:py-32">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            className="!mb-0"
            eyebrow="Product catalog"
            title="Hardware for every link in the energy chain."
            lede="From the module on the roof to the gateway in the control room. Specifications, datasheets and warranties are published per product once verified with the manufacturer."
          />
          <a href={href('/products/')} className="inline-flex h-12 items-center gap-2 rounded-full border border-[var(--line)] px-6 font-semibold transition hover:border-nature hover:text-nature">
            Browse all products <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Filter product categories">
          {GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              role="tab"
              aria-selected={group === g.key}
              onClick={() => setGroup(g.key)}
              className={cn('h-10 rounded-full border px-4 text-sm font-semibold transition', group === g.key ? 'border-forest bg-forest text-white dark:border-nature dark:bg-nature' : 'border-[var(--line)] hover:border-nature')}
            >
              {g.label}
            </button>
          ))}
        </div>

        <motion.ul layout className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {cats.map((c) => {
              const Icon = ICONS[c.slug] ?? PanelsTopLeft;
              const n = counts[c.slug] ?? 0;
              return (
                <motion.li key={c.slug} layout initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}>
                  <a
                    href={href(`/products/?category=${c.slug}`)}
                    className="card group relative flex h-full flex-col overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:border-nature"
                  >
                    <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sun/0 blur-2xl transition duration-500 group-hover:bg-sun/30" />
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-nature-soft text-forest transition group-hover:bg-sun group-hover:text-tech dark:bg-white/5 dark:text-[#7fe0b2]">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="mt-5 font-display text-lg font-bold">{c.name}</span>
                    <span className="muted mt-1.5 flex-1 text-[14.5px]">{BLURB[c.slug]}</span>
                    <span className="mt-5 flex items-center justify-between text-sm">
                      <span className="font-mono text-[11.5px] text-[var(--muted)]">{n > 0 ? `${n} product${n > 1 ? 's' : ''}` : 'Catalog coming soon'}</span>
                      <ArrowUpRight className="h-4 w-4 text-nature transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </a>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>

        {products.length > 0 && (
          <div className="mt-14">
            <p className="eyebrow mb-5">Featured products</p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.slice(0, 4).map((p) => (
                <li key={p.id} className="card overflow-hidden">
                  {p.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0].url} alt={p.images[0].alt || p.name} className="aspect-[4/3] w-full object-contain bg-[var(--surface-2)] p-4" loading="lazy" />
                  )}
                  <div className="p-5">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">{p.brand?.name ?? 'Brand TBC'} · {p.model}</p>
                    <p className="mt-1 font-display font-bold">{p.name}</p>
                    <div className="mt-4 flex gap-2">
                      <a href={href(`/products/${p.slug}/`)} className="text-sm font-semibold text-forest dark:text-[#7fe0b2]">Details</a>
                      <a href={href(`/quotation/?product=${p.id}`)} className="ml-auto text-sm font-semibold text-sun-deep">Request quotation</a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
