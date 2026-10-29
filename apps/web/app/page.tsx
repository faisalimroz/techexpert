import type { Paginated, ProductDTO } from '@te/types';
import { tryApi } from '@/lib/api';
import { Hero } from '@/components/home/hero';
import { EnergyStory } from '@/components/home/energy-story';
import { Solutions } from '@/components/home/solutions';
import { ProductCatalog } from '@/components/home/product-catalog';
import { EmsDashboard } from '@/components/home/ems-dashboard';
import { SolarCalculator } from '@/components/home/solar-calculator';
import { Industries } from '@/components/home/industries';
import { Projects } from '@/components/home/projects';
import { Insights, type PostCard } from '@/components/home/insights';
import { Contact } from '@/components/home/contact';

export const revalidate = 300; // ISR: catalog and posts refresh every 5 minutes

const empty = { items: [], page: 1, limit: 0, total: 0, pages: 0 };

export default async function HomePage() {
  const [products, posts] = await Promise.all([
    tryApi<Paginated<ProductDTO>>('/products?limit=12&sort=-publishedAt', empty),
    tryApi<Paginated<PostCard>>('/blogs?limit=3&sort=-publishedAt', empty),
  ]);

  return (
    <>
      <Hero />
      <EnergyStory />
      <Solutions />
      <ProductCatalog products={products.items} />
      <EmsDashboard />
      <SolarCalculator />
      <Industries />
      <Projects />
      <Insights posts={posts.items} />
      <Contact />
    </>
  );
}
