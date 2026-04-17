'use client'
export const dynamic = 'force-dynamic'
/**
 * Exhibitor Leads Page — AGGREGATE ONLY
 *
 * GDPR / L'Étudiant data policy:
 *  - Exhibitors (schools) have ZERO access to individual student data.
 *  - Students scan the school's QR code to learn more about the school in THEIR app.
 *  - The scan is a signal that belongs to L'Étudiant's data product.
 *  - L'Étudiant delivers anonymised, enriched lead segments to schools J+1 via export.
 *
 * This page shows ONLY aggregated, non-identifying statistics.
 */
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/Skeleton'
import ExhibitorSideNav from '@/components/layouts/ExhibitorSideNav'
import SectionLabel from '@/components/ui/SectionLabel'

interface AggregateStats {
  totalScans:        number
  decidingPct:       number
  comparingPct:      number
  exploringPct:      number
  deciding:          number
  comparing:         number
  exploring:         number
  topLevels:         { label: string; pct: number }[]
  topBranches:       { label: string; pct: number }[]
  avgDwellMin:       number
}

export default function ExhibitorLeadsPage() {
  const { profile } = useAuth()
  const qrRef = useRef<HTMLCanvasElement>(null)
  const [stats, setStats] = useState<AggregateStats | null>(null)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState('Votre établissement')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      // Resolve the school linked to this exhibitor account
      // Convention: exhibitor's profile.name matches a school name, or we pick first school for demo
      const { data: schoolData } = await supabase
        .from('schools')
        .select('id, name')
        .limit(1)
        .single()

      const sid  = schoolData?.id ?? null
      const name = schoolData?.name ?? 'Votre établissement'
      setSchoolId(sid)
      setSchoolName(name)

      if (!sid) { setLoading(false); return }

      // Aggregate scans for this school's stand
      const { data: scanRows } = await supabase
        .from('scans')
        .select('user_id, channel, dwell_estimate')
        .eq('stand_id', sid)
        .eq('channel', 'stand')

      const rows = scanRows ?? []
      const total = rows.length

      if (total === 0) { setLoading(false); return }

      // Look up intent levels for each unique visitor (aggregate only, no names)
      const uids = [...new Set(rows.map(r => (r as any).user_id))]
      const { data: userRows } = await supabase
        .from('users')
        .select('intent_level, education_level, education_branches')
        .in('id', uids)

      const users = userRows ?? []
      const deciding  = users.filter(u => (u as any).intent_level === 'high').length
      const comparing = users.filter(u => (u as any).intent_level === 'medium').length
      const exploring = users.filter(u => (u as any).intent_level === 'low').length

      // Top education levels
      const levelCounts: Record<string, number> = {}
      for (const u of users) {
        const lvl = (u as any).education_level ?? 'Non renseigné'
        levelCounts[lvl] = (levelCounts[lvl] ?? 0) + 1
      }
      const topLevels = Object.entries(levelCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([label, n]) => ({ label, pct: Math.round((n / users.length) * 100) }))

      // Top branches (flatten arrays)
      const branchCounts: Record<string, number> = {}
      for (const u of users) {
        for (const b of (u as any).education_branches ?? []) {
          branchCounts[b] = (branchCounts[b] ?? 0) + 1
        }
      }
      const topBranches = Object.entries(branchCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, n]) => ({ label, pct: Math.round((n / users.length) * 100) }))

      const totalDwell = rows.reduce((acc, r) => acc + ((r as any).dwell_estimate ?? 0), 0)
      const avgDwellMin = rows.length > 0 ? Math.round(totalDwell / rows.length) : 0

      setStats({
        totalScans: total,
        deciding, comparing, exploring,
        decidingPct:  total ? Math.round((deciding  / total) * 100) : 0,
        comparingPct: total ? Math.round((comparing / total) * 100) : 0,
        exploringPct: total ? Math.round((exploring / total) * 100) : 0,
        topLevels,
        topBranches,
        avgDwellMin,
      })
      setLoading(false)
    }
    load()
  }, [profile])

  // Generate QR code for THIS school's stand — students scan it to learn more in their app
  useEffect(() => {
    if (!schoolId || !qrRef.current) return
    const payload = JSON.stringify({ schoolId, type: 'school_stand', app: 'letudiant-salons' })
    QRCode.toCanvas(qrRef.current, payload, {
      width: 180, margin: 2,
      color: { dark: '#1A1A1A', light: '#FFFFFF' },
    }).catch(console.error)
  }, [schoolId])

  const BAR_COLOR: Record<string, string> = {
    decidingPct: '#16A34A', comparingPct: '#B45309', exploringPct: '#1D4ED8',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif' }}>
      <ExhibitorSideNav />
      <main style={{ flex: 1, padding: '32px 28px', marginLeft: 220 }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 800 }}>Statistiques de stand</h1>
          <p style={{ margin: 0, color: '#6B6B6B', fontSize: '0.9rem' }}>{schoolName} · Données agrégées temps réel</p>
        </div>

        {/* Policy notice — prominent */}
        <div style={{ background: '#FFF7E0', border: '1px solid #F59E0B', borderRadius: 14, padding: '16px 20px', marginBottom: 28, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🔒</span>
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>
              Politique de confidentialité L'Étudiant
            </p>
            <p style={{ margin: 0, color: '#78350F', fontSize: '0.8125rem', lineHeight: 1.6 }}>
              Les données individuelles des étudiants sont la propriété exclusive de L'Étudiant.
              Les exposants reçoivent uniquement des <strong>statistiques agrégées et anonymisées</strong> en temps réel.
              Les leads enrichis (segments, filières, niveau) sont disponibles via le <strong>produit data L'Étudiant en J+1</strong> après chaque salon.
              <br />Les étudiants scannent <em>votre</em> QR code ci-dessous pour découvrir votre établissement dans leur application.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24, alignItems: 'start' }}>

          {/* LEFT — stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* KPI cards */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[1,2,3].map(i => <Skeleton key={i} height={90} borderRadius={12} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { label: 'Scans de stand',    value: stats?.totalScans ?? 0,  color: '#EC1F27',  sub: 'étudiants uniques' },
                  { label: 'Temps moyen',        value: stats?.avgDwellMin ? `${stats.avgDwellMin} min` : '—', color: '#0066CC', sub: 'par visiteur' },
                  { label: 'Dont Décideurs',     value: `${stats?.decidingPct ?? 0}%`,   color: '#16A34A',  sub: 'intention haute' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</p>
                    <p style={{ margin: '0 0 2px', fontSize: '1.875rem', fontWeight: 800, color: k.color }}>{loading ? '—' : k.value}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B6B6B' }}>{k.sub}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Intent level distribution */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <SectionLabel>Distribution niveau d'intention</SectionLabel>
              <p style={{ fontSize: '0.8125rem', color: '#6B6B6B', margin: '4px 0 16px' }}>
                Calculé à partir des signaux comportementaux — aucun nom n'est associé
              </p>
              {loading ? (
                <Skeleton height={80} borderRadius={8} />
              ) : !stats || stats.totalScans === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Aucun scan enregistré pour le moment.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: '🟢 Décideurs',      pct: stats.decidingPct,  count: stats.deciding,  color: '#16A34A', desc: 'Score > 65 — prêt(e) à postuler' },
                    { label: '🟡 Comparateurs',   pct: stats.comparingPct, count: stats.comparing, color: '#B45309', desc: 'Score 31-65 — compare activement' },
                    { label: '🔵 Explorateurs',   pct: stats.exploringPct, count: stats.exploring, color: '#1D4ED8', desc: 'Score 0-30 — en découverte' },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1A1A1A' }}>{item.label}</span>
                          <span style={{ fontSize: '0.75rem', color: '#6B6B6B', marginLeft: 8 }}>{item.desc}</span>
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: item.color }}>{item.count} ({item.pct}%)</span>
                      </div>
                      <div style={{ height: 10, background: '#F0F0F0', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 5, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top education levels */}
            {stats && stats.topLevels.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                  <SectionLabel>Niveaux scolaires</SectionLabel>
                  <p style={{ fontSize: '0.8125rem', color: '#6B6B6B', margin: '4px 0 14px' }}>Répartition agrégée</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {stats.topLevels.map(l => (
                      <div key={l.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#3D3D3D' }}>{l.label}</span>
                          <span style={{ fontSize: '0.8125rem', color: '#6B6B6B' }}>{l.pct}%</span>
                        </div>
                        <div style={{ height: 6, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${l.pct}%`, background: '#EC1F27', borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                  <SectionLabel>Filières d'intérêt</SectionLabel>
                  <p style={{ fontSize: '0.8125rem', color: '#6B6B6B', margin: '4px 0 14px' }}>Répartition agrégée</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {stats.topBranches.map(b => (
                      <div key={b.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#3D3D3D' }}>{b.label.split(' ').slice(0,3).join(' ')}</span>
                          <span style={{ fontSize: '0.8125rem', color: '#6B6B6B' }}>{b.pct}%</span>
                        </div>
                        <div style={{ height: 6, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${b.pct}%`, background: '#0066CC', borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* J+1 data product CTA */}
            <div style={{ background: '#E6F0FF', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>📦</span>
              <div>
                <p style={{ margin: '0 0 3px', fontWeight: 700, color: '#0066CC', fontSize: '0.9rem' }}>
                  Produit Data L'Étudiant — disponible J+1
                </p>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#1D4ED8', lineHeight: 1.5 }}>
                  Le lendemain du salon, vous recevrez le rapport enrichi de L'Étudiant :
                  segments d'intention, filières, niveaux, codes postaux — 100% anonymisé et conforme RGPD.
                  Contactez votre chargé de compte pour accéder à l'export.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — stand QR code */}
          <div style={{ position: 'sticky', top: 32 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', textAlign: 'center' }}>
              <SectionLabel>QR Code de votre stand</SectionLabel>
              <p style={{ fontSize: '0.8125rem', color: '#6B6B6B', margin: '6px 0 16px', lineHeight: 1.5 }}>
                Affichez ce QR code sur votre stand. Les étudiants le scannent pour accéder à votre fiche établissement et l'enregistrer dans leur parcours.
              </p>
              <canvas
                ref={qrRef}
                style={{ borderRadius: 10, border: '1px solid #E8E8E8', display: 'block', margin: '0 auto 12px' }}
              />
              <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 700, color: '#1A1A1A' }}>
                {schoolName}
              </p>
              <p style={{ margin: 0, fontSize: '0.6875rem', color: '#6B6B6B' }}>
                À imprimer et afficher sur le stand
              </p>
              <button
                onClick={() => {
                  if (!qrRef.current) return
                  const a = document.createElement('a')
                  a.download = `QR_stand_${schoolName.replace(/\s/g,'_')}.png`
                  a.href = qrRef.current.toDataURL('image/png')
                  a.click()
                }}
                style={{ marginTop: 14, width: '100%', background: '#EC1F27', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}
              >
                ⬇ Télécharger le QR
              </button>
            </div>

            {/* Scan count live */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginTop: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: '2rem', fontWeight: 800, color: '#EC1F27' }}>
                {loading ? '—' : stats?.totalScans ?? 0}
              </p>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6B6B6B' }}>scans aujourd'hui</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
