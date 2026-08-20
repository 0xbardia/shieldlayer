/** @type {import('next').NextConfig} */
const apiTarget = process.env.API_INTERNAL_URL || "http://127.0.0.1:8787";
const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), microphone=(), camera=()",
  },
  // HSTS is host-wide. Sending it on http://IP:3456 makes browsers
  // upgrade to https://IP:3456, which has no TLS. Do not send HSTS
  // while the product is reached by raw IP:port HTTP.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://studio.genlayer.com https://rpc-asimov.genlayer.com https://*.walletconnect.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    if (isProd) return [];
    return [{ source: "/api/:path*", destination: `${apiTarget}/api/:path*` }];
  },
};

module.exports = nextConfig;
