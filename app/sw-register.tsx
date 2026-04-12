'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => console.log('[SW] registered, scope:', reg.scope))
        .catch(err => console.error('[SW] registration failed:', err))
    }
  }, [])

  return null
}
