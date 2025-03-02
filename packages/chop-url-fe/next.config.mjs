/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['storage.chop-url.com'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
