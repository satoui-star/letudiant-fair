import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Sign out the user
  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Clear auth cookies and redirect
  const response = NextResponse.json({ success: true })

  // Clear Supabase auth cookies
  response.cookies.set('sb-auth-token', '', { maxAge: 0 })
  response.cookies.set('sb:token', '', { maxAge: 0 })

  return response
}
