/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Add this configuration
  // allowedDevOrigins: ["http://192.168.1.4:3000", "localhost"],
  devIndicators: {
    allowedDevOrigins: ["https://192.168.1.4:3001", "localhost"],
  },

  // Or if you want to allow all origins during development (less secure):
  // allowedDevOrigins: process.env.NODE_ENV === 'development' ? ['*'] : undefined,

  async rewrites() {
    return [];
  },
};

export default nextConfig;
