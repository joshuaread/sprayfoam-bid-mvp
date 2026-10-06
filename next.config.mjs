/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
// GitHub Pages project site lives under /sprayfoam-bid-mvp.
const basePath = isProd ? '/sprayfoam-bid-mvp' : '';

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
