/** @type {import('next').NextConfig} */
const nextConfig = {
  // Other config options...
  typescript: {
    // Ignore TypeScript errors during production build
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;