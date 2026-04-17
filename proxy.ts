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
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Only refresh session, don't query user (avoids RLS errors)
    await supabase.auth.getSession()

    const { pathname } = request.nextUrl

    // ── Redirect unauthenticated users from protected routes to /login ──
    const PROTECTED = [
      '/home', '/schools', '/discover', '/compare', '/saved', '/qr', '/profile',
      '/recap', '/fair', '/onboarding', '/admin', '/exhibitor', '/teacher', '/parent',
    ]

    const isProtected = PROTECTED.some((p) => pathname.startsWith(p))

    if (isProtected) {
      // Check for session cookie
      const sessionCookie = request.cookies.get('sb-auth-token')
      if (!sessionCookie) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
  } catch (e) {
    console.error('[proxy] auth check failed:', e)
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
