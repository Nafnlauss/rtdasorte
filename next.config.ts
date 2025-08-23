import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xlabgxtdbasbohvowfod.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  eslint: {
    // Durante o build de produção, ignorar erros do ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Durante o build de produção, ignorar erros do TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
