'use client'

import { useEffect } from 'react'
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
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    if (role !== allow) {
      router.replace(role ? ROLE_HOME[role] : '/login')
    }
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
