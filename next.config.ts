import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // SQLite requires Prisma in standalone mode for Docker deployments
  output: 'standalone',
};

export default nextConfig;
