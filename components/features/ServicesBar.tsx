'use client'
import Icon, { type IconName } from '@/components/ui/Icon'

const BASE_SERVICES: { icon: IconName; label: string; href: string; color: string }[] = [
  { icon: 'graduation', label: 'Formations', href: '/schools', color: '#EC1F27' },
  { icon: 'compass',    label: 'Actualités', href: '/discover', color: '#0066CC' },
]

export default function ServicesBar({ eventId }: { eventId?: string }) {
  const services: { icon: IconName; label: string; href: string; color: string }[] = [
    ...BASE_SERVICES,
    { icon: 'map',      label: 'Plan salon', href: eventId ? `/fair/${eventId}` : '#', color: '#FF6B35' },
    { icon: 'calendar', label: 'Agenda',     href: '/schools', color: '#4DB8A8' },
  ]
  return (
    <div style={{ marginBottom: 8 }}>
      <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 12px', color: '#1A1A1A' }}>Services</h2>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
        {services.map(s => (
          <a key={s.label} href={s.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 52, height: 52, background: '#fff', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', color: s.color }}>
              <Icon name={s.icon} size={24} strokeWidth={1.75} />
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#4B4B4B', fontWeight: 500, textAlign: 'center', maxWidth: 56 }}>{s.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
