import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

// ─── Guards ──────────────────────────────────────────────────────────────────
// Throw at call-site rather than silently passing undefined to createServerClient
// (same pattern as client.ts — prevents silent prerender failures on Vercel).
function requireEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      '[Supabase] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required'
    )
  }
  return { url, key }
}

function requireServiceEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      '[Supabase] NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for service client'
    )
  }
  return { url, serviceKey }
}

// ─── Standard server client (uses anon key, respects RLS) ────────────────────
// Use in Server Components, Route Handlers, and Server Actions for normal
// user-scoped operations. Sessions are managed via cookies.
export async function createServerSupabaseClient() {
  const { url, key } = requireEnv()
  const cookieStore = await cookies()

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component — the middleware is responsible
          // for forwarding the refreshed session cookie to the browser.
        }
      },
    },
  })
}

// ─── Service-role client (bypasses RLS — admin operations only) ──────────────
// ⚠️  Never expose this to the client. Use only in:
//   - API Route Handlers  (server-side only)
//   - Supabase Edge Functions
//   - Admin-only pages
export async function createServiceClient() {
  const { url, serviceKey } = requireServiceEnv()
  const cookieStore = await cookies()

  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {}
      },
    },
  })
}

// ─── Admin client (service role + auth.admin API) ─────────────────────────────
// Uses createClient directly (not SSR) to expose auth.admin.createUser() etc.
// ⚠️  Server-side only — never import in 'use client' files.
export function createAdminClient() {
  const { url, serviceKey } = requireServiceEnv()
  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  })
}
