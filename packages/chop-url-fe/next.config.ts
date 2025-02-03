import type { Configuration } from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    runtime: 'edge',
  },
  // Enable Node.js compatibility
  webpack: (config: Configuration, { isServer, dev }: { isServer: boolean; dev: boolean }) => {
    if (!isServer && !dev) {
      if (!config.resolve) config.resolve = {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig 