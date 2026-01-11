/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    // Define CSP policies
    // We must allow 'unsafe-eval' in dev, but for production it's better to remove it.
    // However, Next.js dev mode relies on it. We can try to be strict.
    // 'unsafe-inline' is often needed for Next.js hydration scripts unless we use nonces (complex).
    const isDev = process.env.NODE_ENV === 'development';
    const localRpc = process.env.NEXT_PUBLIC_LOCAL_RPC_URL || 'http://127.0.0.1:8545';
    const arbRpc = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';

    const cspHeader = `
      default-src 'self';
      script-src 'self' ${isDev ? "'unsafe-eval'" : ''} 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data:;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'self';
      block-all-mixed-content;
      connect-src 'self' ${localRpc} ${arbRpc} https://*.walletconnect.com wss://*.walletconnect.com;
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader
          }
        ]
      }
    ];
  },
};

module.exports = nextConfig;
