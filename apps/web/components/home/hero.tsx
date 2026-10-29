'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sun, PanelsTopLeft, Cpu, BatteryCharging, Factory, Zap } from 'lucide-react';
import { simulateSnapshot, type EnergySnapshot } from '@te/solar-engine';
import { asset, href } from '@/lib/site';

/** Photo is 1536×1024. Sun and panel glints in image pixels — used to place the animated light layer. */
const IMG = { w: 1536, h: 1024 };
const SUN = { x: 290, y: 305 };
const GLINTS = [
  [128, 632], [300, 560], [398, 534], [535, 742], [720, 600], [742, 571], [690, 690], [960, 650],
] as const;

function coverMap(W: number, H: number) {
  const s = Math.max(W / IMG.w, H / IMG.h);
  const ox = (W - IMG.w * s) / 2;
  const oy = (H - IMG.h * s) / 2;
  return (x: number, y: number) => [ox + x * s, oy + y * s] as const;
}

export function Hero() {
  const reduce = useReducedMotion();
  const wrap = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { scrollY } = useScroll();
  const photoY = useTransform(scrollY, [0, 900], [0, reduce ? 0 : 140]);
  const photoScale = useTransform(scrollY, [0, 900], [1.06, reduce ? 1.06 : 1.14]);
  const copyY = useTransform(scrollY, [0, 600], [0, reduce ? 0 : -60]);
  const [snap, setSnap] = useState<EnergySnapshot>(() => simulateSnapshot(new Date(new Date().setHours(12, 40, 0, 0))));

  // simulated readings for the flow bar
  useEffect(() => {
    let k = 0;
    const id = setInterval(() => {
      k += 1;
      setSnap(simulateSnapshot(new Date(new Date().setHours(12, 40, 0, 0)), Math.sin(k)));
    }, 2600);
    return () => clearInterval(id);
  }, []);

  // light rays + energy particles
  useEffect(() => {
    const c = canvas.current;
    const host = wrap.current;
    if (!c || !host) return;
    const g = c.getContext('2d')!;
    let W = 0, H = 0, raf = 0, t0 = performance.now();
    let mx = 0, my = 0;
    const parts = Array.from({ length: reduce ? 0 : 90 }, () => newPart(true));

    function newPart(scatter = false) {
      const [gx, gy] = GLINTS[Math.floor(Math.random() * GLINTS.length)]!;
      return { gx: gx + (Math.random() - 0.5) * 120, gy: gy + (Math.random() - 0.5) * 60, p: scatter ? Math.random() : 0, v: 0.0016 + Math.random() * 0.0024, r: 0.8 + Math.random() * 1.8 };
    }
    const size = () => {
      const d = Math.min(2, devicePixelRatio || 1);
      W = host.clientWidth;
      H = host.clientHeight;
      c.width = W * d;
      c.height = H * d;
      g.setTransform(d, 0, 0, d, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(host);
    const onMove = (e: PointerEvent) => {
      mx = (e.clientX / W - 0.5) * 18;
      my = (e.clientY / H - 0.5) * 12;
    };
    host.addEventListener('pointermove', onMove);

    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      const map = coverMap(W, H);
      const [sx, sy] = map(SUN.x, SUN.y);
      g.clearRect(0, 0, W, H);
      g.globalCompositeOperation = 'lighter';

      // sun bloom (breathes slowly)
      const bloom = g.createRadialGradient(sx, sy, 0, sx, sy, Math.max(W, H) * 0.55);
      bloom.addColorStop(0, `rgba(255,214,120,${0.32 + 0.06 * Math.sin(t * 0.8)})`);
      bloom.addColorStop(0.18, 'rgba(255,180,80,.12)');
      bloom.addColorStop(1, 'rgba(255,160,60,0)');
      g.fillStyle = bloom;
      g.fillRect(0, 0, W, H);

      // traveling rays toward the panel field
      for (let i = 0; i < 9; i++) {
        const [tx, ty] = map(GLINTS[i % GLINTS.length]![0], GLINTS[i % GLINTS.length]![1]);
        const phase = (t * 0.22 + i / 9) % 1;
        const px = sx + (tx - sx) * phase;
        const py = sy + (ty - sy) * phase;
        const ray = g.createLinearGradient(sx, sy, px, py);
        ray.addColorStop(0, 'rgba(255,220,140,0)');
        ray.addColorStop(1, `rgba(255,226,150,${0.18 * Math.sin(Math.PI * phase)})`);
        g.strokeStyle = ray;
        g.lineWidth = 2 + 10 * phase;
        g.beginPath();
        g.moveTo(sx, sy);
        g.lineTo(px, py);
        g.stroke();
        // glint pulse where the ray lands
        const pulse = Math.max(0, Math.sin(t * 1.4 + i * 1.7));
        const gl = g.createRadialGradient(tx, ty, 0, tx, ty, 34 + 26 * pulse);
        gl.addColorStop(0, `rgba(255,232,170,${0.55 * pulse})`);
        gl.addColorStop(1, 'rgba(255,232,170,0)');
        g.fillStyle = gl;
        g.fillRect(tx - 70, ty - 70, 140, 140);
      }

      // energy particles: rise from panels and stream toward the flow bar (bottom right)
      const targetX = W * 0.78, targetY = H * 0.9;
      for (const p of parts) {
        p.p += p.v;
        if (p.p >= 1) Object.assign(p, newPart());
        const [ox, oy] = map(p.gx, p.gy);
        const e = p.p * p.p * (3 - 2 * p.p);
        const cx = ox + (targetX - ox) * e + Math.sin(p.p * 9 + p.gx) * 14 + mx * (1 - e);
        const cy = oy - Math.sin(Math.PI * e) * H * 0.12 + (targetY - oy) * e + my * (1 - e);
        const a = Math.sin(Math.PI * p.p);
        g.fillStyle = e > 0.5 ? `rgba(110,240,175,${0.85 * a})` : `rgba(255,224,140,${0.9 * a})`;
        g.beginPath();
        g.arc(cx, cy, p.r * (1 + a), 0, Math.PI * 2);
        g.fill();
      }
      g.globalCompositeOperation = 'source-over';
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener('pointermove', onMove);
    };
  }, [reduce]);

  const flow = [
    { icon: Sun, label: 'Sunlight', value: '≈ 950 W/m²' },
    { icon: PanelsTopLeft, label: 'Solar PV', value: `${Math.round(snap.solarKw)} kW` },
    { icon: Zap, label: 'Inverter', value: 'DC → AC' },
    { icon: Cpu, label: 'Smart EMS', value: 'Optimising' },
    { icon: BatteryCharging, label: 'Battery', value: `${snap.batterySocPct}% · +${Math.round(snap.batteryKw)} kW` },
    { icon: Factory, label: 'Factory & Home', value: `${Math.round(snap.loadKw)} kW` },
  ];

  return (
    <section ref={wrap} className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-tech text-white" aria-label="Introduction">
      <motion.div className="absolute inset-0 -z-20" style={{ y: photoY, scale: photoScale }}>
        <picture>
          <source srcSet={asset('/images/hero-solar-farm-sunrise.webp')} type="image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset('/images/hero-solar-farm-sunrise.jpg')} alt="Solar farm reflecting the sunrise across rows of panels" className="h-full w-full object-cover" fetchPriority="high" />
        </picture>
      </motion.div>
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,30,36,.88)_0%,rgba(7,30,36,.55)_45%,rgba(7,30,36,.05)_80%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-tech/95 via-tech/50 to-transparent" />

      <motion.div style={{ y: copyY }} className="shell flex flex-1 flex-col justify-center pb-10 pt-[calc(120px+env(safe-area-inset-top,0px))]">
        <div className="max-w-[760px] animate-rise">
          <p className="mb-6 flex flex-wrap gap-2 font-mono text-[11.5px] uppercase tracking-[0.18em] text-white/85">
            {['Clean Energy', 'Smart Technology', 'A Brighter Tomorrow'].map((s) => (
              <span key={s} className="rounded-full border border-white/25 bg-white/5 px-3 py-1.5 backdrop-blur-sm">{s}</span>
            ))}
          </p>
          <h1 className="font-display text-display-xl font-extrabold">
            Powering Tomorrow with the{' '}
            <span className="bg-gradient-to-r from-[#FFD872] via-sun to-[#6EF0AF] bg-clip-text text-transparent">Energy of Nature.</span>
          </h1>
          <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-white/85 md:text-xl">
            Intelligent solar technology, renewable energy solutions, and smart IoT systems designed for a cleaner and more sustainable future.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={href('/solutions/')} className="inline-flex h-14 items-center gap-2 rounded-full bg-sun px-7 font-bold text-tech shadow-glow transition hover:-translate-y-0.5 hover:shadow-glow-lg">
              Explore Solar Solutions <ArrowRight className="h-5 w-5" />
            </a>
            <a href={href('/products/')} className="inline-flex h-14 items-center rounded-full border border-white/35 bg-white/10 px-7 font-semibold backdrop-blur-md transition hover:bg-white/20">
              Browse Products
            </a>
            <a href={href('/quotation/')} className="inline-flex h-14 items-center rounded-full px-5 font-semibold text-white underline-offset-4 hover:underline">
              Request a Quotation
            </a>
          </div>
        </div>
      </motion.div>

      {/* Sunlight → … → Factory flow */}
      <div className="shell relative pb-[calc(28px+env(safe-area-inset-bottom,0px))]">
        <div className="rounded-3xl border border-white/15 bg-tech/55 p-4 backdrop-blur-xl md:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/70">
              <span className="mr-2 inline-block h-2 w-2 animate-pulseDot rounded-full bg-nature shadow-[0_0_0_0_rgba(24,167,106,.6)]" />
              How sunlight becomes power
            </span>
            <span className="demo-badge !text-sun">Simulated data</span>
          </div>
          <ol className="relative grid grid-cols-3 gap-y-4 md:grid-cols-6">
            <svg className="pointer-events-none absolute left-[8%] right-[8%] top-[22px] hidden h-2 w-[84%] md:block" viewBox="0 0 100 2" preserveAspectRatio="none" aria-hidden="true">
              <line x1="0" y1="1" x2="100" y2="1" stroke="rgba(255,255,255,.18)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <line x1="0" y1="1" x2="100" y2="1" stroke="#F5B841" strokeWidth="2" strokeDasharray="6 14" className="animate-flow" vectorEffect="non-scaling-stroke" />
            </svg>
            {flow.map((f, i) => (
              <li key={f.label} className="relative flex flex-col items-center text-center">
                <span className={`grid h-11 w-11 place-items-center rounded-full border ${i < 2 ? 'border-sun/60 bg-sun/20 text-sun' : 'border-nature/60 bg-nature/20 text-[#6EF0AF]'} backdrop-blur`}>
                  <f.icon className="h-5 w-5" />
                </span>
                <span className="mt-2 text-[13px] font-semibold">{f.label}</span>
                <span className="tnum font-mono text-[11.5px] text-white/65">{f.value}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
