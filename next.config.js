/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    // Prevent Next.js from bundling Sharp — it must load its native binary
    // from node_modules at runtime (required for Vercel Linux deployment).
    serverComponentsExternalPackages: ['sharp'],
    serverExternalPackages: ['sharp'],
  },
};

module.exports = nextConfig;
