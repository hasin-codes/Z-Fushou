import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { resolve } from "path";

const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf-8"));

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  output: 'standalone',
  turbopack: {
    root: process.cwd(),
  },
  headers: async () => [
    {
      // Apply security headers to all routes
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js needs unsafe-eval in dev
            "style-src 'self' 'unsafe-inline'", // Tailwind/inline styles
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co ws://localhost:* http://localhost:* https://zfushou.hasinraiyan.me https://*.hasinraiyan.me", // Supabase + HMR + Auth
            "frame-ancestors 'none'", // Prevent clickjacking
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; '),
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY', // Prevent clickjacking
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff', // Prevent MIME type sniffing
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin', // Limit referrer leakage
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()', // Disable unnecessary features
        },
      ],
    },
  ],
};

export default nextConfig;
