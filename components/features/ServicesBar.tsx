'use client'
import Icon, { type IconName } from '@/components/ui/Icon'

// External-link constants — change here to repoint a service to a different URL.
const LETUDIANT_ACTUALITES_URL = 'https://www.letudiant.fr/'

const BASE_SERVICES: { icon: IconName; label: string; href: string; color: string }[] = [
  { icon: 'graduation', label: 'Formations', href: '/schools', color: '#EC1F27' },
  { icon: 'compass',    label: 'Actualités', href: LETUDIANT_ACTUALITES_URL, color: '#0066CC' },
]

const isExternal = (href: string) => /^https?:\/\//i.test(href)

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
        {services.map(s => {
          const external = isExternal(s.href)
          return (
            <a
              key={s.label}
              href={s.href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0 }}
            >
              <div style={{ width: 52, height: 52, background: '#fff', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', color: s.color, position: 'relative' }}>
                <Icon name={s.icon} size={24} strokeWidth={1.75} />
                {external && (
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: '#fff',
                      color: s.color,
                      fontSize: 9,
                      fontWeight: 700,
                      lineHeight: '12px',
                      textAlign: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    ↗
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#4B4B4B', fontWeight: 500, textAlign: 'center', maxWidth: 56 }}>{s.label}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
