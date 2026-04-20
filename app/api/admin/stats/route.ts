import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

/**
 * GET /api/admin/stats?eventId=xxx
 *
 * Returns aggregated admin statistics that require service-role access.
 * Protected by requireAdmin() — caller must be an authenticated admin.
 */
export async function GET(req: Request) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  try {
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    const [preRegRes, intentRes] = await Promise.all([
      supabase
        .from('pre_registrations')
        .select('id, resolved_user_id')
        .eq('event_id', eventId),
      supabase
        .from('users')
        .select('intent_level')
        .eq('role', 'student'),
    ])

    const preRegs   = preRegRes.data  ?? []
    const students  = intentRes.data  ?? []

    const preRegTotal    = preRegs.length
    const preRegResolved = preRegs.filter(r => r.resolved_user_id).length

    const intentCounts = {
      low:    students.filter(s => (s as any).intent_level === 'low').length,
      medium: students.filter(s => (s as any).intent_level === 'medium').length,
      high:   students.filter(s => (s as any).intent_level === 'high').length,
    }

    return NextResponse.json({
      preReg: {
        total:         preRegTotal,
        resolved:      preRegResolved,
        unresolved:    preRegTotal - preRegResolved,
        resolutionPct: preRegTotal ? Math.round((preRegResolved / preRegTotal) * 100) : 0,
      },
      intentLevels: intentCounts,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
