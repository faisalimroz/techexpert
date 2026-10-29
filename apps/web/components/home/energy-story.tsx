'use client';

import { useEffect, useState } from 'react';
import { Sun, PanelsTopLeft, Zap, Cpu, BatteryCharging, Building2 } from 'lucide-react';
import { cn } from '@te/ui';
import { SectionHead } from '../ui';
import { SolarPanel3D } from './solar-panel-3d';

const STAGES = [
  {
    icon: Sun,
    name: 'Sunlight',
    title: 'Sunlight reaches the array',
    body: 'Every design starts from local irradiance data for the site, then sets orientation and tilt to capture the most energy across Bangladesh’s dry season and monsoon.',
    measure: ['Irradiance (W/m²)', 'Module temperature', 'Weather forecast'],
  },
  {
    icon: PanelsTopLeft,
    name: 'Solar Panels',
    title: 'Panels convert light into DC power',
    body: 'Photovoltaic modules turn photons into direct current. Each string is monitored, so shading, soiling or a failing module shows up quickly instead of at the next bill.',
    measure: ['String current & voltage', 'Specific yield (kWh/kWp)', 'Soiling loss'],
  },
  {
    icon: Zap,
    name: 'Inverter',
    title: 'The inverter makes grid-ready AC',
    body: 'On-grid, off-grid or hybrid inverters convert DC to AC synchronised with the grid, tracking the maximum power point as the sun moves across the sky.',
    measure: ['AC output (kW)', 'Conversion efficiency', 'Fault codes'],
  },
  {
    icon: Cpu,
    name: 'Smart EMS',
    title: 'Smart energy management decides',
    body: 'The EMS reads meters, inverters and batteries in real time and chooses the cheapest source each moment: use solar, charge storage, import from the grid, or export the surplus.',
    measure: ['Load profile', 'Tariff windows', 'Peak demand'],
  },
  {
    icon: BatteryCharging,
    name: 'Battery Storage',
    title: 'Batteries store the surplus',
    body: 'Midday surplus charges lithium storage, which carries evening peaks and load-shedding hours without starting a diesel generator.',
    measure: ['State of charge', 'Charge / discharge kW', 'Cell temperature'],
  },
  {
    icon: Building2,
    name: 'Factory & Home',
    title: 'Clean power reaches every load',
    body: 'Electricity runs production lines, offices, hospitals and homes, and net-metering credits exported energy where the utility allows it.',
    measure: ['Consumption by area', 'Grid import / export', 'CO₂ avoided'],
  },
];

export function EnergyStory() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STAGES.length), 4200);
    return () => clearInterval(id);
  }, [auto]);

  const s = STAGES[active]!;

  return (
    <section id="energy-story" className="relative py-24 md:py-32">
      <div className="shell">
        <SectionHead
          eyebrow="Energy from nature"
          title="From first light to every switch."
          lede="Six stages turn morning sunlight into managed, reliable electricity. Select a stage to see what happens there and what our systems measure."
        />

        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-start">
          <div>
            <ol className="relative grid gap-2" role="tablist" aria-label="Energy stages">
              <span className="absolute bottom-6 left-[27px] top-6 w-0.5 bg-[var(--line)]" aria-hidden="true" />
              <span
                className="absolute left-[27px] top-6 w-0.5 bg-gradient-to-b from-sun to-nature transition-all duration-700"
                style={{ height: `calc(${(active / (STAGES.length - 1)) * 100}% - ${(active / (STAGES.length - 1)) * 48}px)` }}
                aria-hidden="true"
              />
              {STAGES.map((st, i) => (
                <li key={st.name}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    onClick={() => {
                      setActive(i);
                      setAuto(false);
                    }}
                    className={cn('relative flex w-full items-center gap-4 rounded-2xl px-2 py-2.5 text-left transition', i === active ? 'bg-[var(--surface)] shadow-card' : 'hover:bg-[var(--surface)]/60')}
                  >
                    <span
                      className={cn(
                        'relative z-10 grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full border-2 transition',
                        i === active ? 'border-sun bg-sun text-tech shadow-glow' : i < active ? 'border-nature bg-nature-soft text-forest' : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]',
                      )}
                    >
                      <st.icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-mono text-[11px] uppercase tracking-widest text-[var(--muted)]">Stage {i + 1}</span>
                      <span className="block font-display text-lg font-bold">{st.name}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="card mt-6 p-7" aria-live="polite">
              <h3 className="font-display text-2xl font-bold" style={{ color: 'var(--head)' }}>{s.title}</h3>
              <p className="muted mt-3">{s.body}</p>
              <p className="eyebrow mt-6">What we measure</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {s.measure.map((m) => (
                  <li key={m} className="rounded-full bg-nature-soft px-3 py-1.5 text-sm font-semibold text-forest dark:bg-white/5 dark:text-[#7fe0b2]">{m}</li>
                ))}
              </ul>
            </div>
          </div>

          <SolarPanel3D stage={active} />
        </div>
      </div>
    </section>
  );
}
