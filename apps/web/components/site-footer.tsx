import { NAV, SITE, href } from '@/lib/site';
import { Logo } from './site-header';

export function SiteFooter() {
  const solutions = NAV.find((n) => n.label === 'Solutions')?.mega?.flatMap((g) => g.links) ?? [];
  return (
    <footer className="bg-tech pt-20 text-white/70" style={{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="shell grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-[34ch] font-display text-xl font-semibold leading-snug text-white">{SITE.slogan}</p>
          <p className="mt-4 text-sm">Solar, storage, smart energy management and industrial IoT for Bangladesh and international projects.</p>
        </div>
        <nav aria-label="Solutions">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-sun">Solutions</p>
          <ul className="grid gap-2.5 text-[14.5px]">
            {solutions.map((l) => (
              <li key={l.label}><a href={href(l.href)} className="hover:text-white">{l.label}</a></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Company">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-sun">Company</p>
          <ul className="grid gap-2.5 text-[14.5px]">
            {NAV.filter((n) => !n.mega).map((l) => (
              <li key={l.label}><a href={href(l.href)} className="hover:text-white">{l.label}</a></li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-sun">Contact</p>
          <ul className="grid gap-2.5 text-[14.5px]">
            <li className="select-all">{SITE.contact.email}</li>
            <li className="select-all">{SITE.contact.phone}</li>
            <li>{SITE.contact.address}</li>
          </ul>
        </div>
      </div>
      <div className="shell mt-16 flex flex-wrap justify-between gap-4 border-t border-white/10 pt-8 text-[13px]">
        <span>© {new Date().getFullYear()} TechExpert Energy. All rights reserved.</span>
        <span>Product names and brands belong to their owners. Partnerships are listed only once confirmed.</span>
      </div>
    </footer>
  );
}
