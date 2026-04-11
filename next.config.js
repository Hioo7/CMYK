/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    // Required so Vercel/Next.js does not bundle Sharp — it must load its
    // native binary from the runtime layer instead.
    serverComponentsExternalPackages: ['sharp'],
  },
};

module.exports = nextConfig;
