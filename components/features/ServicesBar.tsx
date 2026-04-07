'use client'

const SERVICES = [
  { icon: '🎓', label: 'Formations', href: '/schools' },
  { icon: '📰', label: 'Actualités', href: '/discover' },
  { icon: '🗺️', label: 'Plan salon', href: '#' },
  { icon: '📅', label: 'Agenda', href: '#' },
  { icon: '💼', label: 'Stages', href: '#' },
  { icon: '🏆', label: 'Classements', href: '#' },
  { icon: '💡', label: 'Conseils', href: '#' },
  { icon: '💬', label: 'Témoignages', href: '#' },
  { icon: '📊', label: 'Statistiques', href: '#' },
]

export default function ServicesBar() {
  return (
    <div style={{ marginBottom: 8 }}>
      <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 12px', color: '#1A1A1A' }}>Services</h2>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
        {SERVICES.map(s => (
          <a key={s.label} href={s.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 52, height: 52, background: '#fff', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
              {s.icon}
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#4B4B4B', fontWeight: 500, textAlign: 'center', maxWidth: 56 }}>{s.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
