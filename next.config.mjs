/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
// GitHub Pages project site lives under /sprayfoam-bid-mvp. Override with PAGES_BASE_PATH if needed.
const basePath = process.env.PAGES_BASE_PATH ?? (isProd ? '/sprayfoam-bid-mvp' : '');

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  reactStrictMode: true,
};

export default nextConfig;
