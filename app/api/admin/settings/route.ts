import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function GET() {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data, error } = await supabase.from('settings').select('*')

    if (error) throw error

    // Convert array to object keyed by setting name
    const settings = (data || []).reduce(
      (acc: Record<string, any>, item: any) => {
        acc[item.key] = item.value
        return acc
      },
      {}
    )

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (err: unknown) {
    console.error('[GET /api/admin/settings]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  try {
    const body = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Upsert each setting
    for (const [key, value] of Object.entries(body)) {
      await supabase
        .from('settings')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
        })
        .select()
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated',
    })
  } catch (err: unknown) {
    console.error('[PUT /api/admin/settings]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
