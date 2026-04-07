'use client'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: number
}

export function Modal({ open, onClose, title, children, maxWidth = 480 }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.48)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 0 0' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto', padding: '24px 24px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {title && <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>{title}</h3>}
          <button onClick={onClose} style={{ background: '#F5F5F5', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
