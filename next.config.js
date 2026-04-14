/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  images: { unoptimized: true },
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
    // Ensures Sharp's native binary is included in the standalone output trace.
    outputFileTracingIncludes: {
      '/api/convert': ['./node_modules/@img/**', './node_modules/sharp/**'],
    },
  },
};

module.exports = nextConfig;
