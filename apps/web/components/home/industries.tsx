import { Shirt, Cog, Building, HeartPulse, GraduationCap, Hotel, Wheat, Warehouse, Home, Landmark } from 'lucide-react';
import { href } from '@/lib/site';
import { Reveal, SectionHead } from '../ui';

const INDUSTRIES = [
  { icon: Shirt, name: 'Garment & Textile Factories', how: 'Rooftop PV across sheds, generator offset, and energy reports that support buyer sustainability audits.' },
  { icon: Cog, name: 'Manufacturing Industries', how: 'Machine-level metering finds idle loads; solar and storage shave the demand peaks that drive tariffs.' },
  { icon: Building, name: 'Commercial Buildings', how: 'Daytime solar matches office and retail load; the EMS tracks every floor and chiller.' },
  { icon: HeartPulse, name: 'Hospitals & Healthcare', how: 'Battery backup keeps critical wards running through outages with seamless transfer.' },
  { icon: GraduationCap, name: 'Educational Institutions', how: 'Campus rooftops cut bills, and live dashboards turn energy into a teaching tool.' },
  { icon: Hotel, name: 'Hotels & Resorts', how: 'Solar hot-water and PV reduce operating cost while guests see a visible green commitment.' },
  { icon: Wheat, name: 'Agriculture & Cold Storage', how: 'Solar pumps and hybrid cold rooms protect harvests and replace diesel in rural sites.' },
  { icon: Warehouse, name: 'Warehouses & Logistics', how: 'Large flat roofs become power plants; EV charging readies fleets for electrification.' },
  { icon: Home, name: 'Residential Communities', how: 'Shared solar and home batteries keep apartments lit through load-shedding.' },
  { icon: Landmark, name: 'Government & Infrastructure', how: 'Solar street lighting, public-building rooftops and monitored microgrids for public works.' },
];

const OUTCOMES = ['Lower electricity costs', 'Clear energy visibility', 'Higher operating efficiency', 'Measurable sustainability'];

export function Industries() {
  return (
    <section id="industries" className="py-24 md:py-32">
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1.5fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHead
              eyebrow="Industries we serve"
              title="Built around how your sector uses power."
              lede="Every sector loads the grid differently. We start from your consumption pattern and design around it."
            />
            <ul className="-mt-4 flex flex-wrap gap-2">
              {OUTCOMES.map((o) => (
                <li key={o} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-1.5 text-sm font-semibold">{o}</li>
              ))}
            </ul>
            <a href={href('/industries/')} className="mt-8 inline-flex font-semibold text-forest underline-offset-4 hover:underline dark:text-[#7fe0b2]">See industry solutions →</a>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {INDUSTRIES.map((i, n) => (
              <Reveal as="li" key={i.name} delay={(n % 2) * 0.06} className="card group flex h-full gap-4 p-5 transition hover:border-nature">
                <>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sun/25 to-nature/25 text-forest transition group-hover:from-sun group-hover:to-sun group-hover:text-tech dark:text-[#7fe0b2]">
                    <i.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display font-bold">{i.name}</span>
                    <span className="muted mt-1 block text-[14.5px]">{i.how}</span>
                  </span>
                </>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
