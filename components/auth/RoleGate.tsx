'use client'

import { useEffect, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import type { UserRow } from '@/lib/supabase/types'

type Role = UserRow['role']

const ROLE_HOME: Record<Role, string> = {
  student:   '/home',
  teacher:   '/teacher/dashboard',
  exhibitor: '/exhibitor/dashboard',
  admin:     '/admin/dashboard',
  parent:    '/parent/home',
}

/**
 * Client-side role guard — last line of defence in addition to the
 * server-side proxy.ts. Renders nothing while the auth state loads,
 * redirects elsewhere if the user is missing or has the wrong role,
 * and otherwise renders its children.
 *
 * Usage:
 *   <RoleGate allow="admin">...</RoleGate>
 */
export default function RoleGate({
  allow,
  children,
}: {
  allow: Role
  children: React.ReactNode
}) {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const target = !user
      ? `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      : role !== allow
        ? (role ? ROLE_HOME[role] : '/login')
        : null
    if (!target) return
    // Defer router.replace to the next tick so the App Router is fully
    // initialized — avoids Next.js 16 "Router action dispatched before
    // initialization" error under Turbopack.
    const id = setTimeout(() => {
      startTransition(() => router.replace(target))
    }, 0)
    return () => clearTimeout(id)
  }, [loading, user, role, allow, router])

  if (loading || !user || role !== allow) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--le-gray-500, #6B6B6B)',
          fontSize: 14,
        }}
      >
        Chargement…
      </div>
    )
  }

  return <>{children}</>
}
