'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X, ArrowRight } from 'lucide-react';
import { cn } from '@te/ui';
import { NAV, asset, href } from '@/lib/site';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href={href('/')} className="flex shrink-0 items-center gap-2.5" aria-label="TechExpert Energy home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset('/images/logo-mark.png')} alt="" width={40} height={41} className="h-10 w-auto" />
      <span className={cn('font-display text-[19px] font-extrabold tracking-tight', light ? 'text-white' : 'text-tech dark:text-white')}>
        TechExpert <span className="text-nature">Energy</span>
      </span>
    </a>
  );
}

export function SiteHeader() {
  const path = usePathname();
  const overHero = path === '/' || path === '';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const closeT = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && (setOpen(null), setMobile(false));
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);
  useEffect(() => {
    document.body.style.overflow = mobile ? 'hidden' : '';
  }, [mobile]);

  const solid = scrolled || !overHero || mobile;

  return (
    <header
      className={cn(
        'fixed inset-x-0 z-50 transition-[background,box-shadow,color] duration-500',
        solid ? 'bg-white/95 shadow-[0_1px_0_rgba(16,43,53,.08),0_12px_30px_-20px_rgba(16,43,53,.35)] backdrop-blur-xl dark:bg-tech/95' : 'bg-gradient-to-b from-tech/50 to-transparent',
      )}
      style={{ top: 'env(safe-area-inset-top, 0px)' }}
      onMouseLeave={() => (closeT.current = setTimeout(() => setOpen(null), 160))}
      onMouseEnter={() => clearTimeout(closeT.current)}
    >
      <div className="shell flex h-[72px] items-center justify-between gap-6">
        <Logo light={!solid} />

        <nav aria-label="Primary" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.label} className="relative">
                {item.mega ? (
                  <button
                    type="button"
                    aria-expanded={open === item.label}
                    aria-controls={`mega-${item.label}`}
                    onMouseEnter={() => setOpen(item.label)}
                    onClick={() => setOpen(open === item.label ? null : item.label)}
                    className={cn('flex items-center gap-1 rounded-full px-3.5 py-2 text-[14.5px] font-semibold transition', solid ? 'text-tech hover:bg-forest/5 dark:text-white' : 'text-white/90 hover:bg-white/10 hover:text-white')}
                  >
                    {item.label}
                    <ChevronDown className={cn('h-4 w-4 transition', open === item.label && 'rotate-180')} />
                  </button>
                ) : (
                  <a
                    href={href(item.href)}
                    onMouseEnter={() => setOpen(null)}
                    className={cn('block rounded-full px-3.5 py-2 text-[14.5px] font-semibold transition', solid ? 'text-tech hover:bg-forest/5 dark:text-white' : 'text-white/90 hover:bg-white/10 hover:text-white')}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a href={href('/quotation/')} className="hidden h-11 items-center gap-2 rounded-full bg-sun px-5 text-[14.5px] font-bold text-tech shadow-glow transition hover:-translate-y-0.5 sm:inline-flex">
            Request a Quotation
          </a>
          <button
            type="button"
            className={cn('grid h-11 w-11 place-items-center rounded-full xl:hidden', solid ? 'text-tech dark:text-white' : 'text-white')}
            aria-label={mobile ? 'Close menu' : 'Open menu'}
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mega menu */}
      {NAV.filter((n) => n.mega && n.label === open).map((item) => (
        <div
          key={item.label}
          id={`mega-${item.label}`}
          className="absolute inset-x-0 top-full hidden border-t border-forest/10 bg-white shadow-2xl xl:block dark:bg-tech"
        >
          <div className="shell grid gap-8 py-9" style={{ gridTemplateColumns: `repeat(${item.mega!.length}, minmax(0,1fr)) minmax(0,1.15fr)` }}>
            {item.mega!.map((g) => (
              <div key={g.title}>
                <p className="eyebrow mb-4">{g.title}</p>
                <ul className="grid gap-1">
                  {g.links.map((l) => (
                    <li key={l.label}>
                      <a href={href(l.href)} className="group block rounded-xl px-3 py-2.5 transition hover:bg-nature-soft dark:hover:bg-white/5" onClick={() => setOpen(null)}>
                        <span className="flex items-center gap-2 font-semibold text-tech group-hover:text-forest dark:text-white">
                          {l.label}
                          <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                        </span>
                        {l.note && <span className="mt-0.5 block text-[13px] text-tech/60 dark:text-white/60">{l.note}</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <a href={href('/calculator/')} className="relative overflow-hidden rounded-2xl bg-forest p-6 text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset('/images/hero-solar-farm-sunrise.webp')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
              <span className="relative block font-mono text-[11px] uppercase tracking-[0.16em] text-sun">Plan your system</span>
              <span className="relative mt-2 block font-display text-2xl font-bold leading-tight">How much could solar save your site?</span>
              <span className="relative mt-4 inline-flex items-center gap-2 text-sm font-semibold">Open the calculator <ArrowRight className="h-4 w-4" /></span>
            </a>
          </div>
        </div>
      ))}

      {/* Mobile drawer */}
      {mobile && (
        <div className="fixed inset-x-0 bottom-0 top-[calc(72px+env(safe-area-inset-top,0px))] overflow-y-auto bg-white pb-10 xl:hidden dark:bg-tech">
          <ul className="shell grid gap-1 py-4">
            {NAV.map((item) => (
              <li key={item.label} className="border-b border-forest/10 py-1">
                {item.mega ? (
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-lg font-semibold text-tech dark:text-white">
                      {item.label} <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
                    </summary>
                    <div className="grid gap-4 pb-4">
                      {item.mega.map((g) => (
                        <div key={g.title}>
                          <p className="eyebrow mb-2">{g.title}</p>
                          {g.links.map((l) => (
                            <a key={l.label} href={href(l.href)} onClick={() => setMobile(false)} className="block py-1.5 text-[15px] text-tech/80 dark:text-white/80">
                              {l.label}
                            </a>
                          ))}
                        </div>
                      ))}
                    </div>
                  </details>
                ) : (
                  <a href={href(item.href)} onClick={() => setMobile(false)} className="block py-3 text-lg font-semibold text-tech dark:text-white">
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <div className="shell">
            <a href={href('/quotation/')} className="flex h-12 items-center justify-center rounded-full bg-sun font-bold text-tech">
              Request a Quotation
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
