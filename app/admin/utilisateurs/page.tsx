'use client'
import { useEffect, useState } from 'react'
import type { EventRow } from '@/lib/supabase/types'

const C = {
  tomate: '#EC1F27', tomateLightLight: '#FFF0F1',
  piscine: '#0066CC', piscineLightLight: '#E6F0FF',
  citron: '#FCD716', citronLight: '#FFF9E6',
  spirit: '#FF6B35', spiritLight: '#FFF0E6',
  gray900: '#191829', gray700: '#3D3D3D', gray500: '#6B6B6B',
  gray200: '#E8E8E8', gray100: '#F4F4F4', blanc: '#F8F7F2',
}

interface User {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'student' | 'exhibitor' | 'teacher' | 'parent'
  created_at: string
  last_login: string | null
  deleted_at: string | null
}

export default function UtilisateursPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'student' | 'exhibitor' | 'teacher' | 'parent'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at'>('created_at')
  const [limit, setLimit] = useState(25)
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [roleFilter, statusFilter, limit, offset])

  async function fetchUsers() {
    setLoading(true)
    try {
      let query = `/api/admin/users?limit=${limit}&offset=${offset}`
      if (roleFilter !== 'all') query += `&role=${roleFilter}`
      if (statusFilter !== 'all') query += `&status=${statusFilter}`

      const res = await fetch(query)
      const data = await res.json()

      let userList = data.data || []

      // Client-side search filter
      if (search) {
        userList = userList.filter((u: User) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
        )
      }

      setUsers(userList)
      setTotalCount(data.count || 0)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(u => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    }
  }

  const getRoleBadge = (role: User['role']) => {
    const roles: Record<User['role'], { label: string; color: string }> = {
      admin: { label: 'Admin', color: C.red },
      student: { label: 'Étudiant', color: C.blue },
      exhibitor: { label: 'Exposant', color: C.yellow },
      teacher: { label: 'Enseignant', color: C.blue },
      parent: { label: 'Parent', color: C.gray500 },
    }
    return roles[role] || { label: role, color: C.gray500 }
  }

  const getStatusBadge = (user: User) => {
    return user.deleted_at ? { label: 'Inactif', color: C.gray500 } : { label: 'Actif', color: C.blue }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const totalPages = Math.ceil(totalCount / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: C.gray900 }}>Utilisateurs</h1>
          <p style={{ margin: 0, fontSize: 14, color: C.gray500 }}>Gérez tous les utilisateurs de la plateforme</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {selectedUsers.length > 0 && (
            <button
              style={{
                padding: '10px 20px',
                background: C.gray100,
                color: C.gray700,
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {selectedUsers.length} sélectionné(s)
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Rechercher par email ou nom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px 12px',
            border: `1px solid ${C.gray200}`,
            borderRadius: 6,
            fontSize: 14,
            flex: 1,
            minWidth: 250,
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as any); setOffset(0) }}
          style={{
            padding: '10px 12px',
            border: `1px solid ${C.gray200}`,
            borderRadius: 6,
            fontSize: 14,
            background: '#fff',
          }}
        >
          <option value="all">Tous les rôles</option>
          <option value="admin">Admin</option>
          <option value="student">Étudiant</option>
          <option value="exhibitor">Exposant</option>
          <option value="teacher">Enseignant</option>
          <option value="parent">Parent</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as any); setOffset(0) }}
          style={{
            padding: '10px 12px',
            border: `1px solid ${C.gray200}`,
            borderRadius: 6,
            fontSize: 14,
            background: '#fff',
          }}
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.gray500 }}>Chargement...</div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.gray500 }}>
          Aucun utilisateur trouvé
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.gray200}`, background: C.gray100 }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: C.gray700, width: 40 }}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: C.gray700 }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: C.gray700 }}>Nom</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: C.gray700 }}>Rôle</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: C.gray700 }}>Statut</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: C.gray700 }}>Inscription</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: C.gray700 }}>Dernier accès</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: C.gray700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const roleBadge = getRoleBadge(user.role)
                  const statusBadge = getStatusBadge(user)
                  return (
                    <tr key={user.id} style={{ borderBottom: `1px solid ${C.gray200}`, background: selectedUsers.includes(user.id) ? C.gray100 : '#fff' }}>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px', color: C.gray900, fontWeight: 500 }}>{user.email}</td>
                      <td style={{ padding: '12px', color: C.gray700 }}>{user.name || '—'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          background: roleBadge.color,
                          color: '#fff',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          background: statusBadge.color,
                          color: '#fff',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: C.gray700 }}>{formatDate(user.created_at)}</td>
                      <td style={{ padding: '12px', color: C.gray700 }}>{formatDate(user.last_login)}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            setSelectedUserDetails(user)
                            setShowDetailsModal(true)
                          }}
                          style={{
                            padding: '6px 12px',
                            background: C.blueLight,
                            color: C.blue,
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <div style={{ color: C.gray500, fontSize: 13 }}>
              Page {currentPage} sur {totalPages} • Total: {totalCount} utilisateurs
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={limit}
                onChange={(e) => { setLimit(parseInt(e.target.value)); setOffset(0) }}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${C.gray200}`,
                  borderRadius: 6,
                  fontSize: 13,
                  background: '#fff',
                }}
              >
                <option value={25}>25 par page</option>
                <option value={50}>50 par page</option>
                <option value={100}>100 par page</option>
              </select>
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                style={{
                  padding: '8px 16px',
                  background: offset === 0 ? C.gray100 : C.gray200,
                  color: C.gray700,
                  border: 'none',
                  borderRadius: 6,
                  cursor: offset === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Précédent
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={currentPage >= totalPages}
                style={{
                  padding: '8px 16px',
                  background: currentPage >= totalPages ? C.gray100 : C.gray200,
                  color: C.gray700,
                  border: 'none',
                  borderRadius: 6,
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUserDetails && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 32,
              maxWidth: 500,
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700 }}>Détails de l'utilisateur</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: C.gray500, textTransform: 'uppercase', fontWeight: 600 }}>Email</p>
                <p style={{ margin: 0, fontSize: 15, color: C.gray900 }}>{selectedUserDetails.email}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: C.gray500, textTransform: 'uppercase', fontWeight: 600 }}>Nom</p>
                <p style={{ margin: 0, fontSize: 15, color: C.gray900 }}>{selectedUserDetails.name || '—'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: C.gray500, textTransform: 'uppercase', fontWeight: 600 }}>Rôle</p>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  background: getRoleBadge(selectedUserDetails.role).color,
                  color: '#fff',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}>
                  {getRoleBadge(selectedUserDetails.role).label}
                </span>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: C.gray500, textTransform: 'uppercase', fontWeight: 600 }}>Statut</p>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  background: getStatusBadge(selectedUserDetails).color,
                  color: '#fff',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}>
                  {getStatusBadge(selectedUserDetails).label}
                </span>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: C.gray500, textTransform: 'uppercase', fontWeight: 600 }}>Date d'inscription</p>
                <p style={{ margin: 0, fontSize: 15, color: C.gray900 }}>{formatDate(selectedUserDetails.created_at)}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: C.gray500, textTransform: 'uppercase', fontWeight: 600 }}>Dernier accès</p>
                <p style={{ margin: 0, fontSize: 15, color: C.gray900 }}>{formatDate(selectedUserDetails.last_login)}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  padding: '10px 16px',
                  background: C.gray100,
                  color: C.gray700,
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Fermer
              </button>
              <button
                style={{
                  padding: '10px 16px',
                  background: C.blue,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Éditer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
