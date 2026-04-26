'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

// ─── Types ───────────────────────────────────────────────────────────────
type JourneyEvent = {
  user_id: string
  event_id: string
  occurred_at: string
  event_type: 'entry' | 'stand' | 'conference' | 'appointment'
  event_label: string
  ref_id: string | null
  ref_name: string | null
  metadata: any
}

type StudentSummary = {
  user_id: string
  student_name: string
  email: string
  education_level: string | null
  bac_series: string | null
  education_branches: string[] | null
  event_id: string | null
  event_name: string | null
  entered_at: string | null
  last_seen_at: string | null
  dwell_minutes: number | null
  unique_stands_visited: number
  total_stand_scans: number
  conferences_attended: number
  appointments_total: number
  appointments_confirmed: number
  engagement_score: number
  behavioral_profile: string
}

// ─── Supabase client ─────────────────────────────────────────────────────
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Icônes d'événement ──────────────────────────────────────────────────
const EVENT_ICONS: Record<JourneyEvent['event_type'], string> = {
  entry: '→',
  stand: '●',
  conference: '▲',
  appointment: '✓',
}

const EVENT_COLORS: Record<JourneyEvent['event_type'], string> = {
  entry:       'bg-neutral-900 text-white',
  stand:       'bg-[#003DA5] text-white',
  conference:  'bg-[#FFD100] text-black',
  appointment: 'bg-[#E30613] text-white',
}

// ─── Composant principal ─────────────────────────────────────────────────
export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params?.id as string

  const [summary, setSummary] = useState<StudentSummary | null>(null)
  const [journey, setJourney] = useState<JourneyEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    Promise.all([
      supabase
        .from('v_student_summary')
        .select('*')
        .eq('user_id', userId)
        .not('event_id', 'is', null)
        .order('entered_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('v_student_journey')
        .select('*')
        .eq('user_id', userId)
        .order('occurred_at', { ascending: true }),
    ]).then(([summaryRes, journeyRes]) => {
      setSummary(summaryRes.data)
      setJourney(journeyRes.data ?? [])
      setLoading(false)
    })
  }, [userId])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <p className="text-neutral-500">Chargement du parcours…</p>
      </main>
    )
  }

  if (!summary) {
    return (
      <main className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center gap-4">
        <p className="text-neutral-500">Étudiant introuvable.</p>
        <Link
          href="/admin/students"
          className="text-sm text-[#E30613] hover:underline"
        >
          ← Retour à la liste
        </Link>
      </main>
    )
  }

  const initials = (summary.student_name ?? '??')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const standCount = journey.filter((j) => j.event_type === 'stand').length
  const uniqueStands = new Set(
    journey.filter((j) => j.event_type === 'stand').map((j) => j.ref_id),
  ).size

  return (
    <main className="min-h-screen bg-[#FAFAF7] text-neutral-900">
      {/* ─── Back nav ──────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 pt-6">
        <button
          onClick={() => router.back()}
          className="text-xs tracking-wider uppercase text-neutral-500 hover:text-black transition"
        >
          ← Retour
        </button>
      </div>

      {/* ─── Header éditorial ─────────────────────────────────────── */}
      <header className="max-w-5xl mx-auto px-8 pt-8 pb-12 border-b border-neutral-200">
        <div className="flex items-start gap-8 flex-wrap">
          <div className="w-24 h-24 rounded-full bg-neutral-900 text-white flex items-center justify-center font-mono text-2xl">
            {initials}
          </div>

          <div className="flex-1">
            <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">
              Fiche parcours · {summary.event_name}
            </p>
            <h1 className="font-serif text-5xl leading-none tracking-tight">
              {summary.student_name}
            </h1>
            <p className="mt-3 text-neutral-600">
              {summary.education_level}
              {summary.bac_series && ` · Série ${summary.bac_series}`}
              {summary.education_branches && summary.education_branches.length > 0 && (
                <> · Intéressé·e par {summary.education_branches.join(', ')}</>
              )}
            </p>
            <p className="text-sm text-neutral-500 mt-1">{summary.email}</p>
          </div>

          <div className="text-right">
            <p className="font-mono text-6xl font-light tabular-nums">
              {summary.engagement_score}
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              Score / 100
            </p>
            <span
              className={`mt-3 inline-block px-3 py-1 text-[10px] tracking-wider uppercase ${
                {
                  Décideur: 'bg-[#E30613] text-white',
                  Explorateur: 'bg-[#FFD100] text-black',
                  Comparateur: 'bg-[#003DA5] text-white',
                  Observateur: 'bg-neutral-200 text-neutral-700',
                  Inscrit: 'bg-neutral-100 text-neutral-500',
                }[summary.behavioral_profile] ?? 'bg-neutral-100'
              }`}
            >
              {summary.behavioral_profile}
            </span>
          </div>
        </div>
      </header>

      {/* ─── Bande de stats ───────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-8 py-10 grid grid-cols-2 md:grid-cols-5 gap-6 border-b border-neutral-200">
        <MetricBlock label="Durée sur place" value={`${summary.dwell_minutes ?? 0} min`} />
        <MetricBlock label="Stands uniques" value={uniqueStands} />
        <MetricBlock label="Scans total" value={summary.total_stand_scans} />
        <MetricBlock label="Conférences" value={summary.conferences_attended} />
        <MetricBlock
          label="Rendez-vous"
          value={`${summary.appointments_confirmed}/${summary.appointments_total}`}
        />
      </section>

      {/* ─── Timeline ─────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-8 py-12">
        <h2 className="font-serif text-3xl mb-2">
          Le <span className="italic">cheminement</span>
        </h2>
        <p className="text-sm text-neutral-500 mb-10">
          Chaque étape, dans l'ordre où elle a eu lieu.
        </p>

        {journey.length === 0 ? (
          <p className="text-neutral-500 italic">
            Aucune activité enregistrée pour cet étudiant.
          </p>
        ) : (
          <ol className="relative">
            {/* Ligne verticale */}
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-neutral-300" />

            {journey.map((event, idx) => (
              <TimelineItem key={idx} event={event} index={idx} />
            ))}
          </ol>
        )}
      </section>

      {/* ─── Map visuelle des stands ──────────────────────────────── */}
      {uniqueStands > 0 && (
        <section className="max-w-5xl mx-auto px-8 py-12 border-t border-neutral-200">
          <h2 className="font-serif text-3xl mb-2">
            Ordre <span className="italic">des visites</span>
          </h2>
          <p className="text-sm text-neutral-500 mb-8">
            Flow des stands visités (ordre chronologique).
          </p>

          <StandFlow journey={journey} />
        </section>
      )}
    </main>
  )
}

// ─── Sous-composants ─────────────────────────────────────────────────────
function MetricBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-2">
        {label}
      </p>
      <p className="font-mono text-2xl font-light tabular-nums">{value}</p>
    </div>
  )
}

function TimelineItem({ event, index }: { event: JourneyEvent; index: number }) {
  const time = new Date(event.occurred_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const date = new Date(event.occurred_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <li className="flex items-start gap-6 pb-8 last:pb-0 relative">
      {/* Marqueur */}
      <div
        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-mono ${EVENT_COLORS[event.event_type]}`}
      >
        {EVENT_ICONS[event.event_type]}
      </div>

      {/* Contenu */}
      <div className="flex-1 pt-1.5">
        <div className="flex items-baseline gap-3 mb-1">
          <p className="font-mono text-sm text-neutral-900">{time}</p>
          <p className="text-xs text-neutral-400">{date}</p>
        </div>

        <p className="font-serif text-xl leading-tight">
          <span className="text-neutral-500">{event.event_label}</span>
          {event.ref_name && (
            <>
              {' '}
              <span className="text-neutral-900">· {event.ref_name}</span>
            </>
          )}
        </p>

        {event.metadata?.status && (
          <p className="text-xs text-neutral-500 mt-1">
            Statut : {event.metadata.status}
          </p>
        )}

        {event.metadata?.school_domains && (
          <p className="text-xs text-neutral-500 mt-1">
            Domaines : {event.metadata.school_domains.join(', ')}
          </p>
        )}
      </div>
    </li>
  )
}

function StandFlow({ journey }: { journey: JourneyEvent[] }) {
  const stands = journey
    .filter((j) => j.event_type === 'stand')
    .filter((j, idx, arr) => arr.findIndex((x) => x.ref_id === j.ref_id) === idx)

  return (
    <div className="flex flex-wrap items-center gap-3">
      {stands.map((stand, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-3 bg-white border border-neutral-300">
            <span className="font-mono text-xs text-neutral-400 tabular-nums">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <span className="text-sm">{stand.ref_name}</span>
          </div>
          {idx < stands.length - 1 && (
            <span className="text-neutral-300 font-mono">→</span>
          )}
        </div>
      ))}
    </div>
  )
}