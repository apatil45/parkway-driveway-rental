/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@parkway/database', '@parkway/shared'],
  // Don't bundle Stripe Node SDK in API routes; load from node_modules at runtime (avoids bundling its deep dependency tree)
  serverExternalPackages: ['stripe'],
  experimental: {
    externalDir: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "connect-src 'self' https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org https://api.stripe.com https://js.stripe.com",
              "img-src 'self' data: https: blob:",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
