import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js 16 Proxy (replaces middleware.ts in Next.js 16+)
 *
 * Responsibilities:
 *  1. Refresh the Supabase session cookie on every request (required by @supabase/ssr)
 *  2. Redirect unauthenticated visitors away from protected routes
 *  3. Redirect authenticated visitors away from auth pages (login / register)
 *
 * Docs: https://nextjs.org/docs/messages/middleware-to-proxy
 */
export async function proxy(request: NextRequest) {
  // Guard: if Supabase env vars are missing (e.g. CI without .env), pass through
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // 1. Forward refreshed cookies onto the mutated request object
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            // 2. Re-build supabaseResponse so the browser receives updated cookies
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // ⚠️  DO NOT remove — triggers the internal token refresh
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // ── Protected routes (require authentication) ──────────────────────
    // NOTE: route groups like (student) are transparent — the browser URL
    // is /home, /schools, etc. — NOT /student/home.
    const PROTECTED = [
      '/home',
      '/schools',
      '/discover',
      '/compare',
      '/saved',
      '/qr',
      '/profile',
      '/recap',
      '/fair',
      '/onboarding',
      '/admin',
      '/exhibitor',
      '/teacher',
      '/parent',
    ]

    // ── Auth-only routes (redirect away if already logged in) ──────────
    const AUTH_PAGES = ['/login', '/register']

    const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
    const isAuthPage  = AUTH_PAGES.some((p)  => pathname.startsWith(p))

    if (isProtected && !user) {
      // Not logged in → send to /login and preserve the intended destination
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isAuthPage && user) {
      // Already logged in → no reason to be on login/register
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = '/home'
      homeUrl.searchParams.delete('redirectTo')
      return NextResponse.redirect(homeUrl)
    }
  } catch (e) {
    // Never block the request — degrade gracefully on unexpected errors
    console.error('[proxy] Supabase auth check failed:', e)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Run on every route except:
     *  - _next/static  (compiled assets)
     *  - _next/image   (image optimiser)
     *  - favicon.ico, manifest.json, sw.js
     *  - Static public assets (images, fonts, icons)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}
