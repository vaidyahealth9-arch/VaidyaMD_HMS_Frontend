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
        // Ensure HTML documents are never stale-cached by CDNs across deployments
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
