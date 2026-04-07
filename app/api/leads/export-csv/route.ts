import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/leads/export-csv?schoolId=xxx&eventId=xxx&tier=deciding
export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const schoolId = searchParams.get('schoolId')
  const eventId = searchParams.get('eventId')
  const tier = searchParams.get('tier')

  let query = supabase
    .from('leads')
    .select('*, users(name, email, education_level, education_branches, postal_code, orientation_stage)')
    .order('score_value', { ascending: false })

  if (schoolId) query = query.eq('school_id', schoolId)
  if (eventId) query = query.eq('event_id', eventId)
  if (tier) query = query.eq('score_tier', tier)

  const { data: leads, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build CSV
  const headers = ['Nom', 'Email', 'Niveau', 'Filières', 'Code Postal', 'Score', 'Segment', 'Stands Visités', 'Temps (min)', 'Exporté le']
  const rows = (leads ?? []).map((l: Record<string, unknown>) => {
    const u = l.users as Record<string, unknown> | null
    return [
      u?.name ?? '',
      u?.email ?? '',
      u?.education_level ?? '',
      Array.isArray(u?.education_branches) ? (u.education_branches as string[]).join(' | ') : '',
      u?.postal_code ?? '',
      l.score_value,
      l.score_tier,
      Array.isArray(l.stands_visited) ? (l.stands_visited as string[]).length : 0,
      l.dwell_minutes,
      new Date().toLocaleDateString('fr-FR'),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const bom = '\uFEFF' // UTF-8 BOM for Excel

  return new Response(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads_letudiant_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
