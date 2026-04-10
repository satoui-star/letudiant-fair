import type { NextConfig } from 'next'

// Extract the Supabase project hostname from the public URL env var so that
// Next.js <Image /> can optimise images served from Supabase Storage.
// e.g. "https://fembpkkczgbwacdackte.supabase.co" → "fembpkkczgbwacdackte.supabase.co"
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : '*.supabase.co'

const nextConfig: NextConfig = {
  typescript: {
    // Types are checked separately in CI; build must not block on hand-written DB types
    ignoreBuildErrors: true,
  },

  // ── Image optimisation ──────────────────────────────────────────────────
  // Allow next/image to load photos from Supabase Storage.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // ── Security + Service-Worker headers ──────────────────────────────────
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options',  value: 'nosniff' },
        { key: 'X-Frame-Options',         value: 'DENY' },
        { key: 'X-XSS-Protection',        value: '1; mode=block' },
        { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy',      value: 'camera=(self), microphone=(), geolocation=()' },
      ],
    },
    // Service Worker must be served with no-cache so updates are picked up immediately
    {
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control',           value: 'no-cache, no-store, must-revalidate' },
        { key: 'Service-Worker-Allowed',  value: '/' },
      ],
    },
  ],
}

export default nextConfig
