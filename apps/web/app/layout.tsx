import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SITE, asset } from '@/lib/site';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'TechExpert Energy — Solar, Battery Storage & Smart Energy Management in Bangladesh', template: '%s | TechExpert Energy' },
  description:
    'Solar energy solutions in Bangladesh: commercial and industrial solar installation, hybrid inverters, battery energy storage systems, IoT energy monitoring and smart energy management.',
  keywords: [
    'Solar Energy Solutions Bangladesh',
    'Industrial Solar Installation Bangladesh',
    'Solar Inverter Supplier',
    'Smart Energy Management System',
    'Solar IoT Monitoring',
    'Commercial Solar Power Solutions',
    'Battery Energy Storage Systems',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: 'en_BD',
    images: [{ url: '/images/og-default.jpg', width: 1200, height: 630, alt: 'Solar farm at sunrise' }],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: asset('/images/logo-mark.png') },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#F5FAF7' }, { media: '(prefers-color-scheme: dark)', color: '#0A1D24' }],
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  slogan: SITE.slogan,
  url: SITE.url,
  logo: `${SITE.url}/images/logo-full.png`,
  address: { '@type': 'PostalAddress', addressLocality: 'Dhaka', addressCountry: 'BD' },
  areaServed: ['BD', 'Worldwide'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="claude:viewport-fit-sides" content="cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap"
        />
        {process.env.STATIC_PREVIEW === '1' && (
          // Static preview only: the App Router expects the page at "/". Pin relative assets to the real folder with <base>,
          // then present the URL as "/" so hydration matches wherever the preview is hosted.
          <script
            dangerouslySetInnerHTML={{
              __html:
                "(function(){var p=location.pathname,d=p.replace(/[^/]*$/,'');if(p==='/')return;var b=document.createElement('base');b.href=d;document.head.prepend(b);history.replaceState(null,'','/'+location.search+location.hash)})();",
            }}
          />
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-sun focus:px-4 focus:py-2 focus:text-tech">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
