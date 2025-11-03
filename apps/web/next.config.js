/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@parkway/database', '@parkway/shared'],
  experimental: {
    externalDir: true,
  },
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  },
}

module.exports = nextConfig
