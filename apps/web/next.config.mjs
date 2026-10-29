/** @type {import('next').NextConfig} */
const preview = process.env.STATIC_PREVIEW === '1';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const config = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@te/types', '@te/validation', '@te/solar-engine', '@te/ui'],
  env: { NEXT_PUBLIC_ASSET_BASE: preview ? '.' : '' },
  images: { unoptimized: preview, formats: ['image/avif', 'image/webp'] },
  ...(preview
    ? { output: 'export', assetPrefix: '.', trailingSlash: true }
    : {
        output: 'standalone',
        async headers() {
          return [{ source: '/:path*', headers: securityHeaders }];
        },
      }),
};

export default config;
