import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const rawApi = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const backendRoot = rawApi.replace(/\/api\/?$/, '');
    return [
      {
        source: '/uploads/:path*',
        destination: `${backendRoot}/uploads/:path*`,
      },
      {
        source: '/api/uploads/:path*',
        destination: `${backendRoot}/uploads/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        // HTML pages must NEVER be cached by Firebase CDN — always fetch from origin.
        // Next.js static assets (/_next/static/) already get immutable caching by default.
        // no-store prevents stale HTML with wrong asset hashes after new deployments.
        source: '/((?!_next/static).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
