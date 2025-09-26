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
  allowedDevOrigins: ['192.168.59.194', 'localhost'],
  
  // Or if you want to allow all origins during development (less secure):
  // allowedDevOrigins: process.env.NODE_ENV === 'development' ? ['*'] : undefined,
  
  async rewrites() {
    return []
  }
}

export default nextConfig