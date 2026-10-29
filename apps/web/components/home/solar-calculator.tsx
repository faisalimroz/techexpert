'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, ChevronDown, Info } from 'lucide-react';
import { DEFAULT_ASSUMPTIONS, ESTIMATE_DISCLAIMER, LOCATIONS, estimateSolar, type Assumptions, type LocationKey, type SystemType } from '@te/solar-engine';
import { cn } from '@te/ui';
import { api } from '@/lib/api';
import { SectionHead } from '../ui';

const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
const bdt = (n: number) => (n >= 1e7 ? `৳ ${(n / 1e7).toFixed(2)} crore` : n >= 1e5 ? `৳ ${(n / 1e5).toFixed(2)} lakh` : `৳ ${fmt(n)}`);

export function SolarCalculator() {
  const [mode, setMode] = useState<'kwh' | 'bill'>('bill');
  const [kwh, setKwh] = useState(12000);
  const [bill, setBill] = useState(140000);
  const [tariff, setTariff] = useState(11.5);
  const [roof, setRoof] = useState(8000);
  const [panel, setPanel] = useState(580);
  const [loc, setLoc] = useState<LocationKey>('dhaka');
  const [sys, setSys] = useState<SystemType>('on-grid');
  const [a, setA] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [showA, setShowA] = useState(false);
  const [sending, setSending] = useState<'idle' | 'busy' | 'done' | 'offline'>('idle');

  const input = useMemo(
    () => ({
      monthlyKwh: mode === 'kwh' ? kwh : undefined,
      monthlyBillBdt: mode === 'bill' ? bill : undefined,
      tariffBdtPerKwh: tariff,
      roofSqft: roof || undefined,
      panelWatt: panel,
      location: loc,
      systemType: sys,
    }),
    [mode, kwh, bill, tariff, roof, panel, loc, sys],
  );
  const r = useMemo(() => {
    try {
      return estimateSolar(input, a);
    } catch {
      return null;
    }
  }, [input, a]);

  const cash = useMemo(() => {
    if (!r) return [];
    let c = -r.investmentBdt;
    return Array.from({ length: 26 }, (_, y) => {
      if (y > 0) c += r.annualSavingsBdt * (1 - a.degradationPct / 100) ** (y - 1);
      return { y, lakh: Math.round(c / 1e5) / 1 };
    });
  }, [r, a.degradationPct]);

  async function requestProposal() {
    if (!r) return;
    setSending('busy');
    let calculationId: string | undefined;
    try {
      const res = await api<{ id: string }>('/solar-calculator', { method: 'POST', body: JSON.stringify(input) });
      calculationId = res.id;
      setSending('done');
    } catch {
      setSending('offline');
    }
    window.dispatchEvent(
      new CustomEvent('te:prefill', {
        detail: { type: 'site-assessment', powerRequirement: `${r.installedKwp} kWp ${sys}`, location: LOCATIONS[loc].name, calculationId },
      }),
    );
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  }

  const setNum = (fn: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => fn(Math.max(0, +e.target.value || 0));

  return (
    <section id="calculator" className="bg-[var(--surface)] py-24 md:py-32">
      <div className="shell">
        <SectionHead
          eyebrow="Solar power calculator"
          title="Size your system in under a minute."
          lede="Enter what you know. We estimate capacity, panels, roof space, generation, savings, payback and CO₂ reduction using the assumptions shown, which you can change."
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          {/* Inputs */}
          <form className="card grid content-start gap-5 p-6 md:p-8" onSubmit={(e) => e.preventDefault()} aria-label="Calculator inputs">
            <div>
              <span className="label">Start from</span>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface-2)] p-1">
                {(['bill', 'kwh'] as const).map((k) => (
                  <button key={k} type="button" onClick={() => setMode(k)} aria-pressed={mode === k} className={cn('h-10 rounded-lg text-sm font-semibold transition', mode === k ? 'bg-[var(--surface)] shadow-card' : 'muted')}>
                    {k === 'bill' ? 'Monthly bill (BDT)' : 'Monthly consumption (kWh)'}
                  </button>
                ))}
              </div>
            </div>
            {mode === 'bill' ? (
              <label htmlFor="c-bill">
                <span className="label">Monthly electricity bill (BDT)</span>
                <input id="c-bill" type="number" inputMode="numeric" min={0} className="field tnum" value={bill} onChange={setNum(setBill)} />
              </label>
            ) : (
              <label htmlFor="c-kwh">
                <span className="label">Monthly electricity consumption (kWh)</span>
                <input id="c-kwh" type="number" inputMode="numeric" min={0} className="field tnum" value={kwh} onChange={setNum(setKwh)} />
              </label>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <label htmlFor="c-tariff">
                <span className="label">Electricity tariff (BDT/kWh)</span>
                <input id="c-tariff" type="number" step="0.1" min={1} className="field tnum" value={tariff} onChange={(e) => setTariff(Math.max(0.1, +e.target.value || 0.1))} />
              </label>
              <label htmlFor="c-roof">
                <span className="label">Available rooftop area (sq ft)</span>
                <input id="c-roof" type="number" min={0} className="field tnum" value={roof} onChange={setNum(setRoof)} placeholder="Leave 0 if unsure" />
              </label>
              <label htmlFor="c-panel">
                <span className="label">Solar panel wattage (W)</span>
                <select id="c-panel" className="field" value={panel} onChange={(e) => setPanel(+e.target.value)}>
                  {[450, 500, 550, 580, 600, 620, 700].map((w) => (
                    <option key={w} value={w}>{w} W</option>
                  ))}
                </select>
              </label>
              <label htmlFor="c-loc">
                <span className="label">Installation location</span>
                <select id="c-loc" className="field" value={loc} onChange={(e) => setLoc(e.target.value as LocationKey)}>
                  {Object.entries(LOCATIONS).map(([k, v]) => (
                    <option key={k} value={k}>{v.name} division</option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <span className="label">System type</span>
              <div className="grid grid-cols-3 gap-2">
                {(['on-grid', 'hybrid', 'off-grid'] as const).map((k) => (
                  <button key={k} type="button" onClick={() => setSys(k)} aria-pressed={sys === k} className={cn('h-11 rounded-xl border text-sm font-semibold capitalize transition', sys === k ? 'border-forest bg-forest text-white dark:border-nature dark:bg-nature' : 'border-[var(--line)] hover:border-nature')}>
                    {k.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)]">
              <button type="button" onClick={() => setShowA(!showA)} aria-expanded={showA} className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold">
                Engineering assumptions <ChevronDown className={cn('h-4 w-4 transition', showA && 'rotate-180')} />
              </button>
              {showA && (
                <div className="grid gap-3 border-t border-[var(--line)] p-4 text-sm sm:grid-cols-2">
                  {(
                    [
                      ['performanceRatio', 'Performance ratio', 0.01],
                      ['sqftPerKwp', 'Roof area per kWp (sq ft)', 1],
                      ['selfConsumptionPct', 'Self-consumption share', 0.05],
                      ['exportCreditPct', 'Export credit (net-metering)', 0.05],
                      ['gridEmissionKgPerKwh', 'Grid CO₂ (kg/kWh)', 0.01],
                      ['degradationPct', 'Module degradation %/yr', 0.1],
                    ] as const
                  ).map(([k, l, step]) => (
                    <label key={k} htmlFor={`a-${k}`}>
                      <span className="mb-1 block text-[13px] font-semibold">{l}</span>
                      <input id={`a-${k}`} type="number" step={step} className="field tnum !py-2" value={a[k]} onChange={(e) => setA({ ...a, [k]: +e.target.value })} />
                    </label>
                  ))}
                  <label htmlFor="a-cost" className="sm:col-span-2">
                    <span className="mb-1 block text-[13px] font-semibold">Installed cost for {sys} (BDT per kWp, placeholder)</span>
                    <input id="a-cost" type="number" step={1000} className="field tnum !py-2" value={a.costPerKwp[sys]} onChange={(e) => setA({ ...a, costPerKwp: { ...a.costPerKwp, [sys]: +e.target.value } })} />
                  </label>
                  <p className="muted sm:col-span-2 text-[12.5px]">Peak sun hours for {LOCATIONS[loc].name}: {LOCATIONS[loc].psh} h/day (indicative).</p>
                </div>
              )}
            </div>
          </form>

          {/* Results */}
          <div className="grid content-start gap-5" aria-live="polite">
            {r ? (
              <>
                <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-forest via-forest to-[#0b7a5a] p-7 text-white md:p-8">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-sun">Recommended solar capacity</p>
                      <p className="tnum mt-2 font-display text-[clamp(3rem,7vw,4.75rem)] font-extrabold leading-none">
                        {r.installedKwp < 100 ? r.installedKwp.toFixed(1) : fmt(r.installedKwp)}
                        <span className="ml-2 text-2xl font-bold text-white/70">kWp</span>
                      </p>
                    </div>
                    <span className="demo-badge !border-white/30 !bg-white/10 !text-white">Estimate</span>
                  </div>
                  <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                    {[
                      ['Solar panels', `${fmt(r.panels)} × ${panel} W`],
                      ['Roof area needed', `${fmt(r.roofSqftNeeded)} sq ft`],
                      ['Daily generation', `${fmt(r.dailyKwh)} kWh`],
                      ['Monthly generation', `${fmt(r.monthlyKwh)} kWh`],
                      ['Annual savings', bdt(r.annualSavingsBdt)],
                      ['Investment (est.)', bdt(r.investmentBdt)],
                      ['Simple payback', r.paybackYears ? `${r.paybackYears} years` : '—'],
                      ['CO₂ reduction', `${r.co2TonnesPerYear} t / year`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[12px] text-white/60">{k}</dt>
                        <dd className="tnum mt-0.5 font-display text-lg font-bold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {r.warnings.length > 0 && (
                    <ul className="mt-6 grid gap-1.5 border-t border-white/15 pt-4 text-[13px] text-white/75">
                      {r.warnings.map((w) => (
                        <li key={w} className="flex gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0 text-sun" />{w}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="card p-5">
                    <p className="eyebrow mb-3">Monthly generation · kWh</p>
                    <div className="h-[190px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={r.monthlyProfile} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                          <CartesianGrid stroke="var(--line)" vertical={false} />
                          <XAxis dataKey="month" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} interval={1} />
                          <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                          <Tooltip formatter={(v: number) => [`${fmt(v)} kWh`, 'Generation']} contentStyle={{ borderRadius: 12 }} />
                          <Bar dataKey="kwh" fill="#F5B841" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="card p-5">
                    <p className="eyebrow mb-3">Cumulative cash flow · BDT lakh</p>
                    <div className="h-[190px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cash} margin={{ top: 4, right: 18, left: -6, bottom: 0 }}>
                          <CartesianGrid stroke="var(--line)" vertical={false} />
                          <XAxis dataKey="y" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} interval={4} tickFormatter={(v) => `Y${v}`} />
                          <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(v: number) => [`৳ ${v} lakh`, 'Cumulative']} labelFormatter={(l) => `Year ${l}`} contentStyle={{ borderRadius: 12 }} />
                          <ReferenceLine y={0} stroke="var(--muted)" strokeDasharray="4 4" />
                          <Line type="monotone" dataKey="lakh" stroke="#18A76A" strokeWidth={2.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button type="button" onClick={requestProposal} disabled={sending === 'busy'} className="inline-flex h-14 items-center gap-2 rounded-full bg-sun px-7 font-bold text-tech shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60">
                    {sending === 'busy' ? 'Saving…' : 'Request Detailed Solar Proposal'} <ArrowRight className="h-5 w-5" />
                  </button>
                  <p className="muted max-w-[46ch] text-[13px]">{ESTIMATE_DISCLAIMER}</p>
                </div>
                {sending === 'offline' && <p className="text-sm text-sun-deep">We could not save the estimate right now. Your figures are copied into the form below so nothing is lost.</p>}
              </>
            ) : (
              <div className="card p-8">
                <p className="font-semibold">Enter a monthly bill or consumption above zero to see an estimate.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
