'use client'
import { createContext, useContext, useState, useCallback, useRef } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${++counter.current}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }

  const colors: Record<ToastType, string> = {
    success: '#22c55e',
    error: '#E3001B',
    warning: '#f59e0b',
    info: '#003C8F',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: '#1A1A1A', color: '#fff', borderRadius: 12, padding: '12px 20px',
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500,
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)', minWidth: 240, maxWidth: 340,
            animation: 'slideUp 0.22s ease',
          }}>
            <span style={{ color: colors[t.type], fontWeight: 700, fontSize: 16 }}>{icons[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
