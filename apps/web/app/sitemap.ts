import type { MetadataRoute } from 'next';
import { PAGES, SITE } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...Object.keys(PAGES).map((slug) => ({ url: `${SITE.url}/${slug}/`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 })),
    // Phase 2: append /products/<slug>, /projects/<slug>, /insights/<slug> from the API
  ];
}
