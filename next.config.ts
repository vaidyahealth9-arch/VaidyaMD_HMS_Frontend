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
};

export default nextConfig;
