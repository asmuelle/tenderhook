import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@tenderhook/core', '@tenderhook/pipeline'],
};

export default nextConfig;
