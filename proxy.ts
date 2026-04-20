import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js 16 Proxy (replaces middleware.ts).
 *
 * 1. Refreshes the Supabase session cookie on every request (required by @supabase/ssr)
 * 2. Gates role-scoped areas of the app:
 *      /admin/*            → admin
 *      /exhibitor/*        → exhibitor
 *      /teacher/*          → teacher
 *      /parent/*           → parent
 *      /home, /discover, /saved, /profile, /virtual, /compare, /qr,
 *      /fair/*, /schools/*, /recap/*   → student
 * 3. Sends unauthenticated visitors to /login?redirect=<path>
 * 4. Bounces wrong-role users to their own home
 *
 * Docs: https://nextjs.org/docs/messages/middleware-to-proxy
 */

type Role = 'student' | 'teacher' | 'exhibitor' | 'admin' | 'parent'

const ROLE_HOME: Record<Role, string> = {
  student:   '/home',
  teacher:   '/teacher/dashboard',
  exhibitor: '/exhibitor/dashboard',
  admin:     '/admin/dashboard',
  parent:    '/parent/home',
}

/** Which role (if any) is required for this pathname. */
function requiredRoleFor(pathname: string): Role | null {
  // Public shortcuts that live under role-scoped prefixes
  if (pathname === '/exhibitor/login') return null

  if (pathname.startsWith('/admin'))     return 'admin'
  if (pathname.startsWith('/exhibitor')) return 'exhibitor'
  if (pathname.startsWith('/teacher'))   return 'teacher'
  if (pathname.startsWith('/parent'))    return 'parent'

  // Student paths (the (student) route group maps these URLs to student)
  const studentExact = [
    '/home', '/discover', '/saved', '/profile',
    '/virtual', '/compare', '/qr',
  ]
  if (studentExact.includes(pathname)) return 'student'
  if (
    pathname.startsWith('/home/') ||
    pathname.startsWith('/discover/') ||
    pathname.startsWith('/saved/') ||
    pathname.startsWith('/profile/') ||
    pathname.startsWith('/virtual/') ||
    pathname.startsWith('/compare/') ||
    pathname.startsWith('/qr/') ||
    pathname.startsWith('/fair/') ||
    pathname.startsWith('/schools/') ||
    pathname.startsWith('/recap/')
  ) return 'student'

  return null
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requiredRole = requiredRoleFor(pathname)

  // Pass through if env vars missing (CI / preview without .env)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

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
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Unprotected path — we still call getUser() so the session cookie refreshes.
  const { data: { user } } = await supabase.auth.getUser()

  if (!requiredRole) {
    return response
  }

  // Protected path, no user → /login
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Resolve role — prefer public.users row (authoritative), fall back to JWT
  let role = (user.user_metadata?.role ?? null) as Role | null
  try {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (profile?.role) role = profile.role as Role
  } catch {
    // RLS or transient error — fall back to JWT role below
  }

  if (role !== requiredRole) {
    const url = request.nextUrl.clone()
    url.pathname = role ? ROLE_HOME[role] : '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // Run on every route except Next internals, static files, explicit public
  // surfaces (landing, auth flows, admin-setup, sw/manifest) and API routes.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|workbox-.*|icons/|images/|login|register|onboarding|auth|booth|admin-setup|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}
