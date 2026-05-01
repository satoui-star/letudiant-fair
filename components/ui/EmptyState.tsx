import type { ReactNode } from 'react'
import Icon from './Icon'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: { label: string; href?: string; onClick?: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const renderedIcon = icon ?? <Icon name="inbox" size={48} strokeWidth={1.5} />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', gap: 12 }}>
      <div style={{ color: '#9B9B9B', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
        {typeof renderedIcon === 'string'
          ? <span style={{ fontSize: 48 }}>{renderedIcon}</span>
          : renderedIcon}
      </div>
      <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{title}</h3>
      {description && <p style={{ fontSize: '0.875rem', color: '#6B6B6B', margin: 0, maxWidth: 280, lineHeight: 1.5 }}>{description}</p>}
      {action && (
        action.href
          ? <a href={action.href} style={{ marginTop: 8, display: 'inline-block', background: '#EC1F27', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>{action.label}</a>
          : <button onClick={action.onClick} style={{ marginTop: 8, background: '#EC1F27', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>{action.label}</button>
      )}
    </div>
  )
}
