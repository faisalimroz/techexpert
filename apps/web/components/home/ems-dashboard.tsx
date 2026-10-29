'use client';

import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, CheckCircle2, Info, Pause, Play, Sun, Zap, Gauge, Cpu, BatteryCharging, Factory, Building2, UtilityPole } from 'lucide-react';
import { simulateDay } from '@te/solar-engine';
import { cn } from '@te/ui';
import { SectionHead } from '../ui';

const TARIFF = 11; // BDT/kWh blended (demo assumption)
const EF = 0.67; // kg CO2 / kWh (demo assumption)
const isPeak = (h: number) => h >= 17 && h < 23;
const C = { solar: '#F5B841', load: '#5DB3E6', grid: '#E76F51', battery: '#6EF0AF', grid2: 'rgba(255,255,255,.08)', axis: 'rgba(255,255,255,.55)' };

function Kpi({ label, value, unit, sub, tone = 'default' }: { label: string; value: string; unit?: string; sub?: string; tone?: 'default' | 'good' | 'sun' }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/55">{label}</p>
      <p className={cn('tnum mt-1.5 font-display text-[26px] font-extrabold leading-none', tone === 'good' ? 'text-[#6EF0AF]' : tone === 'sun' ? 'text-sun' : 'text-white')}>
        {value}
        {unit && <span className="ml-1 text-sm font-semibold text-white/55">{unit}</span>}
      </p>
      {sub && <p className="mt-1.5 text-[12.5px] text-white/55">{sub}</p>}
    </div>
  );
}

/** PV → Inverter → Smart Meter → EMS → Battery → Factory / Building / Grid */
function FlowDiagram({ solar, load, imp, exp, batt, soc }: { solar: number; load: number; imp: number; exp: number; batt: number; soc: number }) {
  const node = (x: number, y: number, Icon: React.ComponentType<{ className?: string }>, label: string, val: string, hue: string) => (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-62" y="-36" width="124" height="72" rx="16" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.14)" />
      <foreignObject x="-62" y="-36" width="124" height="72">
        <div className="flex h-full flex-col items-center justify-center text-center">
          <Icon className={`h-[18px] w-[18px] ${hue}`} />
          <span className="mt-1 text-[11px] font-semibold text-white/75">{label}</span>
          <span className="tnum font-mono text-[12.5px] font-semibold text-white">{val}</span>
        </div>
      </foreignObject>
    </g>
  );
  const wire = (d: string, on: boolean, color: string, reverse = false) => (
    <g>
      <path d={d} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="2.5" />
      {on && <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="6 12" className="animate-flow" style={reverse ? { animationDirection: 'reverse' } : undefined} />}
    </g>
  );
  const factory = Math.round(load * 0.72), building = Math.round(load * 0.28);
  return (
    <div className="overflow-x-auto">
      <svg viewBox="0 0 880 330" className="min-w-[680px]" role="img" aria-label="Energy flow from solar PV through inverter, smart meter and EMS to battery, factory, building and grid">
        {wire('M122 80 H208', solar > 1, C.solar)}
        {wire('M332 80 H418', solar > 1, C.solar)}
        {wire('M542 80 C590 80 590 165 628 165', true, C.battery)}
        {wire('M480 116 V214', batt !== 0, C.battery, batt < 0)}
        {wire('M690 201 V245 H758', true, C.load)}
        {wire('M690 201 V245 H622', true, C.load)}
        {wire('M752 165 H800 V80 H758', imp > 0 || exp > 0, imp > 0 ? C.grid : C.battery, imp > 0)}
        {node(60, 80, Sun, 'Solar PV', `${Math.round(solar)} kW`, 'text-sun')}
        {node(270, 80, Zap, 'Inverter', solar > 1 ? 'DC → AC' : 'Standby', 'text-sun')}
        {node(480, 80, Gauge, 'Smart Meter', `${Math.round(load)} kW`, 'text-[#5DB3E6]')}
        {node(690, 165, Cpu, 'EMS', 'Optimising', 'text-[#6EF0AF]')}
        {node(480, 250, BatteryCharging, 'Battery', `${soc}% ${batt > 0 ? '↑' : batt < 0 ? '↓' : '·'} ${Math.abs(Math.round(batt))} kW`, 'text-[#6EF0AF]')}
        {node(820, 270, Factory, 'Factory', `${factory} kW`, 'text-[#5DB3E6]')}
        {node(620, 290, Building2, 'Building', `${building} kW`, 'text-[#5DB3E6]')}
        {node(820, 44, UtilityPole, 'Grid', imp > 0 ? `↓ ${Math.round(imp)} kW` : exp > 0 ? `↑ ${Math.round(exp)} kW` : 'Idle', imp > 0 ? 'text-[#E76F51]' : 'text-[#6EF0AF]')}
      </svg>
    </div>
  );
}

const ALERTS = [
  { tone: 'warn', icon: AlertTriangle, text: 'String B-07 producing 12% below neighbours', hint: 'Likely soiling — cleaning scheduled' },
  { tone: 'info', icon: Info, text: 'INV-02 grid frequency event cleared', hint: 'Auto-reconnected after 42 s' },
  { tone: 'ok', icon: CheckCircle2, text: 'BESS cell temperatures within range', hint: 'Max 31.4 °C' },
] as const;

const LAYERS = [
  { t: 'IoT sensors · Smart meters · Solar inverters · BESS', s: 'Field devices' },
  { t: 'Industrial IoT gateway', s: 'Edge buffering, unit-id mapping' },
  { t: 'MQTT  ·  Modbus TCP / RTU  ·  Vendor cloud API', s: 'Protocols' },
  { t: 'Node.js data processing service', s: 'Validation, scaling, roll-ups, alarms' },
  { t: 'MongoDB time-series collections', s: 'Raw readings + 15 min / daily aggregates' },
  { t: 'Express.js API  ·  Socket.IO', s: 'REST history, live push' },
  { t: 'Next.js energy dashboard', s: 'Customers, operators, sales' },
];

export function EmsDashboard() {
  const day = useMemo(() => simulateDay(new Date('2026-03-18T00:00:00')), []);
  const [idx, setIdx] = useState(52); // 13:00
  const [play, setPlay] = useState(true);

  useEffect(() => {
    if (!play) return;
    const id = setInterval(() => setIdx((i) => (i + 1 >= 96 ? 24 : i + 1)), 900);
    return () => clearInterval(id);
  }, [play]);

  const data = useMemo(
    () =>
      day.map((p, i) => ({
        t: `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`,
        solar: p.solarKw,
        load: p.loadKw,
        grid: p.gridImportKw,
        battery: p.batteryKw,
      })),
    [day],
  );

  const m = useMemo(() => {
    const upto = day.slice(0, idx + 1);
    const sum = (f: (p: (typeof day)[number]) => number) => upto.reduce((s, p) => s + f(p) * 0.25, 0);
    const solarKwh = sum((p) => p.solarKw);
    const loadKwh = sum((p) => p.loadKw);
    const impKwh = sum((p) => p.gridImportKw);
    const expKwh = sum((p) => p.gridExportKw);
    let peak = 0, off = 0;
    upto.forEach((p, i) => (isPeak(i / 4) ? (peak += p.gridImportKw * 0.25) : (off += p.gridImportKw * 0.25)));
    return { solarKwh, loadKwh, impKwh, expKwh, peak, off, saved: (solarKwh - expKwh) * TARIFF + expKwh * TARIFF * 0.9, co2: (solarKwh * EF) / 1000 };
  }, [day, idx]);

  const now = day[idx]!;
  const hourBars = useMemo(
    () =>
      Array.from({ length: 24 }, (_, h) => {
        const slice = day.slice(h * 4, h * 4 + 4);
        const imp = slice.reduce((s, p) => s + p.gridImportKw * 0.25, 0);
        return { h: String(h).padStart(2, '0'), peak: isPeak(h) ? Math.round(imp) : 0, offpeak: isPeak(h) ? 0 : Math.round(imp) };
      }),
    [day],
  );
  const invPerf = now.solarKw > 5 ? 96 + Math.round(Math.sin(idx / 3) * 2) : 0;

  return (
    <section id="ems" className="relative overflow-hidden bg-tech py-24 text-white md:py-32">
      <div className="pointer-events-none absolute -left-40 top-20 h-[480px] w-[480px] rounded-full bg-nature/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-ocean/25 blur-[120px]" />
      <div className="shell relative">
        <SectionHead
          dark
          eyebrow="Smart IoT & energy management"
          title="See every kilowatt, from panel to production line."
          lede="Our EMS brings solar, grid, battery and loads onto one screen and acts on them automatically. Below is a demonstration for a 500 kWp factory rooftop with 1 MWh of storage."
        />

        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-sun/30 bg-sun/10 px-4 py-3 text-sm">
          <span className="demo-badge !text-sun">Simulated demonstration</span>
          <span className="text-white/75">Not connected to live devices. Real plants stream data through the architecture shown below.</span>
          <span className="ml-auto flex items-center gap-3">
            <button type="button" onClick={() => setPlay(!play)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={play ? 'Pause timeline' : 'Play timeline'}>
              {play ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <label className="flex items-center gap-3">
              <span className="sr-only">Time of day</span>
              <input id="ems-time" type="range" min={0} max={95} value={idx} onChange={(e) => (setIdx(+e.target.value), setPlay(false))} className="w-36 accent-sun sm:w-56" />
              <output className="tnum w-12 font-mono font-semibold text-sun">{data[idx]!.t}</output>
            </label>
          </span>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_1.35fr]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">
            <Kpi label="Solar generation" value={String(Math.round(now.solarKw))} unit="kW" sub="Real-time output" tone="sun" />
            <Kpi label="Consumption today" value={Math.round(m.loadKwh).toLocaleString('en-US')} unit="kWh" sub={`Now ${Math.round(now.loadKw)} kW`} />
            <Kpi label="Solar production today" value={Math.round(m.solarKwh).toLocaleString('en-US')} unit="kWh" sub={`${(m.solarKwh / 500).toFixed(2)} kWh/kWp`} tone="sun" />
            <Kpi label="Grid import / export" value={`${Math.round(m.impKwh)} / ${Math.round(m.expKwh)}`} unit="kWh" sub="Today" />
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/55">Battery state of charge</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="relative h-7 flex-1 overflow-hidden rounded-md border border-white/25">
                  <div className="h-full bg-gradient-to-r from-nature to-[#6EF0AF] transition-[width] duration-700" style={{ width: `${now.batterySocPct}%` }} />
                  {now.batteryKw > 0 && <div className="absolute inset-y-0 w-10 animate-[flow_1.6s_linear_infinite] bg-white/25 blur-sm" style={{ left: `${now.batterySocPct - 12}%` }} />}
                </div>
                <span className="tnum font-display text-xl font-extrabold text-[#6EF0AF]">{now.batterySocPct}%</span>
              </div>
              <p className="mt-1.5 text-[12.5px] text-white/55">{now.batteryKw > 0 ? `Charging ${Math.round(now.batteryKw)} kW` : now.batteryKw < 0 ? `Discharging ${Math.round(-now.batteryKw)} kW` : 'Idle'}</p>
            </div>
            <Kpi label="CO₂ avoided today" value={m.co2.toFixed(2)} unit="t" sub="Grid factor 0.67 kg/kWh" tone="good" />
            <Kpi label="Energy cost savings" value={`৳ ${Math.round(m.saved).toLocaleString('en-IN')}`} sub={`At ৳${TARIFF}/kWh blended`} tone="good" />
            <Kpi label="Peak / off-peak import" value={`${Math.round(m.peak)} / ${Math.round(m.off)}`} unit="kWh" sub="Peak 17:00–23:00" />
            <Kpi label="Inverter performance" value={invPerf ? `${invPerf}` : '—'} unit={invPerf ? '%' : undefined} sub="Actual vs expected" />
            <Kpi label="Equipment health" value="1" unit="alert" sub="12 devices online" />
          </div>

          <div className="grid gap-5">
            <div className="rounded-3xl border border-white/10 bg-white/[.03] p-4 md:p-6">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">Energy network</p>
              <FlowDiagram solar={now.solarKw} load={now.loadKw} imp={now.gridImportKw} exp={now.gridExportKw} batt={now.batteryKw} soc={now.batterySocPct} />
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[.03] p-4 md:p-6">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">Power today · kW</p>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gSolar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={C.solar} stopOpacity={0.55} />
                        <stop offset="1" stopColor={C.solar} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={C.grid2} vertical={false} />
                    <XAxis dataKey="t" interval={15} tick={{ fill: C.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#102B35', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: C.axis }} />
                    <Area type="monotone" dataKey="solar" name="Solar" stroke={C.solar} fill="url(#gSolar)" strokeWidth={2.2} isAnimationActive={false} />
                    <Area type="monotone" dataKey="load" name="Load" stroke={C.load} fill="none" strokeWidth={2} strokeDasharray="5 4" isAnimationActive={false} />
                    <Area type="monotone" dataKey="grid" name="Grid import" stroke={C.grid} fill={C.grid} fillOpacity={0.12} strokeWidth={1.6} isAnimationActive={false} />
                    <Area type="monotone" dataKey="battery" name="Battery (+charge)" stroke={C.battery} fill={C.battery} fillOpacity={0.1} strokeWidth={1.6} isAnimationActive={false} />
                    <ReferenceLine x={data[idx]!.t} stroke="#fff" strokeOpacity={0.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[.03] p-4 md:p-6">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">Grid import by hour · peak vs off-peak · kWh</p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourBars} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={C.grid2} vertical={false} />
                  <XAxis dataKey="h" interval={2} tick={{ fill: C.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,.05)' }} contentStyle={{ background: '#102B35', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, color: '#fff' }} />
                  <Bar dataKey="offpeak" name="Off-peak" stackId="a" fill="#5DB3E6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="peak" name="Peak" stackId="a" fill={C.grid} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[.03] p-4 md:p-6">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">Equipment health & alerts</p>
            <ul className="grid gap-2.5">
              {ALERTS.map((a) => (
                <li key={a.text} className="flex gap-3 rounded-xl bg-white/[.04] p-3">
                  <a.icon className={cn('mt-0.5 h-5 w-5 shrink-0', a.tone === 'warn' ? 'text-sun' : a.tone === 'info' ? 'text-[#5DB3E6]' : 'text-[#6EF0AF]')} />
                  <span>
                    <span className="block text-[14.5px] font-semibold">{a.text}</span>
                    <span className="block text-[13px] text-white/55">{a.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow mb-3 !text-sun">Integration architecture</p>
            <h3 className="font-display text-display-md font-extrabold">Built to connect to the devices you already own.</h3>
            <p className="mt-4 max-w-[52ch] text-white/70">
              Gateways read inverters, meters and batteries over Modbus TCP/RTU, MQTT or the vendor’s cloud API. A Node.js service validates and stores every reading in MongoDB time-series collections, and dashboards update live over WebSockets.
            </p>
          </div>
          <ol className="grid gap-2">
            {LAYERS.map((l, i) => (
              <li key={l.t} className="relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3">
                <span className="tnum grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 font-mono text-xs text-sun">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block font-semibold">{l.t}</span>
                  <span className="block text-[13px] text-white/55">{l.s}</span>
                </span>
                {i < LAYERS.length - 1 && <span className="absolute -bottom-2 left-[31px] z-10 h-2 w-0.5 bg-sun/60" aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
