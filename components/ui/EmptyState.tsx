interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: { label: string; href?: string; onClick?: () => void }
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', gap: 12 }}>
      <div style={{ fontSize: 48, lineHeight: 1 }}>{icon}</div>
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
