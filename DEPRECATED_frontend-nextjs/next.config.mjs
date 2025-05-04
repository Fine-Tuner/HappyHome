/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  experimental: {
    turbo: {
      resolveAlias: {
        canvas: './empty-module.ts',
        encoding: './empty-module.ts',
      },
    },
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/announcements',
        permanent: true,
      },
    ];
  },
};

export default nextConfig; 