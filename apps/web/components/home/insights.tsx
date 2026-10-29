import { href } from '@/lib/site';
import { SectionHead } from '../ui';

export interface PostCard {
  title: string;
  slug: string;
  excerpt?: string;
  tags?: string[];
  publishedAt?: string;
}

/** Topics the content team has planned; shown until real posts are published in the CMS. */
const PLANNED: PostCard[] = [
  { title: 'Net-metering in Bangladesh: what factory owners should check first', slug: 'net-metering-guide', tags: ['Policy'] },
  { title: 'On-grid, off-grid or hybrid: choosing the right inverter for your site', slug: 'choosing-inverters', tags: ['Technology'] },
  { title: 'Peak shaving with batteries: when storage pays for itself', slug: 'peak-shaving-bess', tags: ['Storage'] },
];

export function Insights({ posts }: { posts: PostCard[] }) {
  const list = posts.length ? posts.slice(0, 3) : PLANNED;
  const planned = posts.length === 0;
  return (
    <section id="insights" className="py-24 md:py-28">
      <div className="shell">
        <SectionHead eyebrow="News & insights" title="Practical knowledge for energy decisions." />
        <ul className="grid gap-5 md:grid-cols-3">
          {list.map((p) => (
            <li key={p.slug}>
              <a href={href(`/insights/${planned ? '' : `${p.slug}/`}`)} className="card group flex h-full flex-col p-6 transition hover:-translate-y-1 hover:border-nature">
                <span className="flex items-center gap-2">
                  {p.tags?.[0] && <span className="rounded-full bg-sun-soft px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#8a5a00] dark:bg-sun/15 dark:text-sun">{p.tags[0]}</span>}
                  {planned && <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">Coming soon</span>}
                </span>
                <span className="mt-5 font-display text-xl font-bold leading-snug group-hover:text-forest dark:group-hover:text-[#7fe0b2]">{p.title}</span>
                {p.excerpt && <span className="muted mt-2 text-[14.5px]">{p.excerpt}</span>}
                <span className="mt-auto pt-6 text-sm font-semibold text-forest dark:text-[#7fe0b2]">{planned ? 'In preparation' : 'Read article →'}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
