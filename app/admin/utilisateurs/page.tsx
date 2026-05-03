'use client'
import { useEffect, useState } from 'react'

const C = {
  tomate: '#EC1F27',
  tomateDark: '#C41520',
  tomateLight: '#FFF0F1',
  piscine: '#0066CC',
  piscineLight: '#E6F0FF',
  citron: '#FCD716',
  citronLight: '#FFF9E6',
  spirit: '#FF6B35',
  spiritLight: '#FFF0E6',
  framboise: '#E91E63',
  framboiseLight: '#FCE4EC',
  menthe: '#4DB8A8',
  mentheLight: '#E0F2EF',
  tropical: '#00BFB3',
  tropicalLight: '#E0F7F5',
  pourpre: '#932D99',
  pourpreLight: '#F3E5F5',
  nuit: '#2B1B4D',
  blanc: '#F8F7F2',
  gray900: '#191829',
  gray700: '#3D3D3D',
  gray500: '#6B6B6B',
  gray300: '#D4D4D4',
  gray200: '#E8E8E8',
  gray100: '#F4F4F4',
}

const ROLE_STYLE: Record<string, { label: string; color: string; light: string }> = {
  admin:     { label: 'Admin',     color: C.tomate,    light: C.tomateLight },
  student:   { label: 'Étudiant',  color: C.piscine,   light: C.piscineLight },
  exhibitor: { label: 'Exposant',  color: C.spirit,    light: C.spiritLight },
  teacher:   { label: 'Enseignant', color: C.menthe,   light: C.mentheLight },
  parent:    { label: 'Parent',    color: C.pourpre,   light: C.pourpreLight },
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
  const [roleFilter, setRoleFilter] = useState<'all' | User['role']>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
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
    setSelectedUsers(checked ? users.map(u => u.id) : [])
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(checked ? [...selectedUsers, userId] : selectedUsers.filter(id => id !== userId))
  }

  const getRoleStyle = (role: User['role']) => ROLE_STYLE[role] || { label: role, color: C.gray500, light: C.gray100 }
  const getStatusStyle = (user: User) =>
    user.deleted_at
      ? { label: 'Inactif', color: C.gray500, light: C.gray100 }
      : { label: 'Actif', color: C.menthe, light: C.mentheLight }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Summary counts
  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalPages = Math.max(1, Math.ceil(totalCount / limit))
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <div style={{ minHeight: '100vh', background: C.blanc }}>
      {/* Signature multicolor stripe */}
      <div
        style={{
          height: 6,
          background: `linear-gradient(90deg, ${C.tomate} 0 16.66%, ${C.piscine} 16.66% 33.33%, ${C.citron} 33.33% 50%, ${C.spirit} 50% 66.66%, ${C.menthe} 66.66% 83.33%, ${C.pourpre} 83.33% 100%)`,
        }}
      />

      <div style={{ padding: '40px 48px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Editorial header */}
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: 'inline-block',
              position: 'relative',
              paddingBottom: 8,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: C.gray500,
              }}
            >
              Administration — Communauté
            </span>
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: 28,
                height: 3,
                background: C.tomate,
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: 900,
                  color: C.nuit,
                  textTransform: 'uppercase',
                  lineHeight: 0.95,
                  letterSpacing: '-0.03em',
                }}
              >
                Utilisateurs
              </h1>
              <p
                style={{
                  margin: '12px 0 0',
                  fontSize: 16,
                  color: C.gray500,
                  maxWidth: 560,
                  lineHeight: 1.5,
                }}
              >
                Gérez les <strong style={{ color: C.nuit }}>{totalCount}</strong> membres de la plateforme — étudiants, exposants, enseignants et administrateurs.
              </p>
            </div>

            {selectedUsers.length > 0 && (
              <div
                style={{
                  padding: '12px 20px',
                  background: C.nuit,
                  color: '#fff',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.citron }} />
                {selectedUsers.length} sélectionné{selectedUsers.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Role summary cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 32,
          }}
        >
          {(['admin', 'student', 'exhibitor', 'teacher', 'parent'] as const).map(role => {
            const r = ROLE_STYLE[role]
            return (
              <div
                key={role}
                style={{
                  background: '#fff',
                  border: `1px solid ${C.gray200}`,
                  borderLeft: `4px solid ${r.color}`,
                  padding: '18px 20px',
                  borderRadius: 2,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: r.color,
                    marginBottom: 8,
                  }}
                >
                  {r.label}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: C.nuit,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  {roleCounts[role] || 0}
                </div>
              </div>
            )
          })}
        </div>

        {/* Filter bar */}
        <div
          style={{
            background: '#fff',
            border: `1px solid ${C.gray200}`,
            padding: 16,
            borderRadius: 4,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <input
              type="text"
              placeholder="Rechercher par email ou nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchUsers() }}
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                border: `1.5px solid ${C.gray200}`,
                borderRadius: 2,
                fontSize: 14,
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.tomate)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.gray200)}
            />
            <span
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: C.gray500,
                fontSize: 16,
              }}
            >
              ⌕
            </span>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as any); setOffset(0) }}
            style={selectStyle}
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
            style={selectStyle}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={emptyStateStyle}>Chargement...</div>
        ) : users.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.tomate, marginBottom: 8 }}>
              Aucun résultat
            </div>
            <div style={{ color: C.gray500, fontSize: 15 }}>
              Aucun utilisateur ne correspond aux filtres sélectionnés.
            </div>
          </div>
        ) : (
          <>
            <div style={{ background: '#fff', border: `1px solid ${C.gray200}`, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: C.nuit }}>
                      <th style={{ ...thStyle, width: 48 }}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          style={{ cursor: 'pointer', accentColor: C.tomate }}
                        />
                      </th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Nom</th>
                      <th style={thStyle}>Rôle</th>
                      <th style={thStyle}>Statut</th>
                      <th style={thStyle}>Inscription</th>
                      <th style={thStyle}>Dernier accès</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, idx) => {
                      const role = getRoleStyle(user.role)
                      const status = getStatusStyle(user)
                      const isSelected = selectedUsers.includes(user.id)
                      return (
                        <tr
                          key={user.id}
                          style={{
                            borderBottom: idx === users.length - 1 ? 'none' : `1px solid ${C.gray200}`,
                            background: isSelected ? C.tomateLight : '#fff',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = C.gray100 }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = '#fff' }}
                        >
                          <td style={tdStyle}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                              style={{ cursor: 'pointer', accentColor: C.tomate }}
                            />
                          </td>
                          <td style={{ ...tdStyle, color: C.nuit, fontWeight: 600 }}>{user.email}</td>
                          <td style={{ ...tdStyle, color: C.gray700 }}>{user.name || <span style={{ color: C.gray300 }}>—</span>}</td>
                          <td style={tdStyle}>
                            <span style={badgeStyle(role.light, role.color)}>{role.label}</span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: status.color,
                                  boxShadow: user.deleted_at ? 'none' : `0 0 0 3px ${status.light}`,
                                }}
                              />
                              <span style={{ fontSize: 12, fontWeight: 700, color: status.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                {status.label}
                              </span>
                            </span>
                          </td>
                          <td style={{ ...tdStyle, color: C.gray700, fontSize: 13 }}>{formatDate(user.created_at)}</td>
                          <td style={{ ...tdStyle, color: C.gray700, fontSize: 13 }}>{formatDate(user.last_login ?? user.created_at)}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <button
                              onClick={() => { setSelectedUserDetails(user); setShowDetailsModal(true) }}
                              style={{
                                padding: '6px 14px',
                                background: 'transparent',
                                color: C.piscine,
                                border: `1.5px solid ${C.piscine}`,
                                borderRadius: 2,
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = C.piscine
                                e.currentTarget.style.color = '#fff'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = C.piscine
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
            </div>

            {/* Pagination */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 24,
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div style={{ color: C.gray500, fontSize: 13, letterSpacing: '0.02em' }}>
                Page <strong style={{ color: C.nuit }}>{currentPage}</strong> sur <strong style={{ color: C.nuit }}>{totalPages}</strong>
                <span style={{ margin: '0 10px', color: C.gray300 }}>·</span>
                <strong style={{ color: C.nuit }}>{totalCount}</strong> utilisateurs au total
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(parseInt(e.target.value)); setOffset(0) }}
                  style={{ ...selectStyle, padding: '8px 12px', fontSize: 13 }}
                >
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  style={paginationBtnStyle(offset === 0)}
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={currentPage >= totalPages}
                  style={paginationBtnStyle(currentPage >= totalPages)}
                >
                  Suivant →
                </button>
              </div>
            </div>
          </>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedUserDetails && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(25, 24, 41, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 20,
            }}
            onClick={() => setShowDetailsModal(false)}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 4,
                maxWidth: 520,
                width: '100%',
                maxHeight: '85vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal stripe */}
              <div
                style={{
                  height: 6,
                  background: `linear-gradient(90deg, ${C.tomate} 0 25%, ${C.piscine} 25% 50%, ${C.citron} 50% 75%, ${C.menthe} 75% 100%)`,
                }}
              />
              <div style={{ padding: 32, overflowY: 'auto' }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: C.tomate,
                    marginBottom: 8,
                  }}
                >
                  Profil utilisateur
                </div>
                <h2
                  style={{
                    margin: '0 0 28px',
                    fontSize: 28,
                    fontWeight: 900,
                    color: C.nuit,
                    letterSpacing: '-0.02em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                  }}
                >
                  {selectedUserDetails.name || 'Sans nom'}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 28 }}>
                  <Field label="Email" value={selectedUserDetails.email} />
                  <Field label="Nom" value={selectedUserDetails.name || '—'} />
                  <div>
                    <FieldLabel>Rôle</FieldLabel>
                    <span style={badgeStyle(getRoleStyle(selectedUserDetails.role).light, getRoleStyle(selectedUserDetails.role).color)}>
                      {getRoleStyle(selectedUserDetails.role).label}
                    </span>
                  </div>
                  <div>
                    <FieldLabel>Statut</FieldLabel>
                    <span style={badgeStyle(getStatusStyle(selectedUserDetails).light, getStatusStyle(selectedUserDetails).color)}>
                      {getStatusStyle(selectedUserDetails).label}
                    </span>
                  </div>
                  <Field label="Date d'inscription" value={formatDate(selectedUserDetails.created_at)} />
                  <Field label="Dernier accès" value={formatDate(selectedUserDetails.last_login)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    style={{
                      padding: '12px 16px',
                      background: 'transparent',
                      color: C.gray700,
                      border: `1.5px solid ${C.gray300}`,
                      borderRadius: 2,
                      fontWeight: 800,
                      fontSize: 12,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    Fermer
                  </button>
                  <button
                    style={{
                      padding: '12px 16px',
                      background: C.tomate,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 2,
                      fontWeight: 800,
                      fontSize: 12,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    Éditer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper components
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <p style={{ margin: 0, fontSize: 15, color: '#191829', fontWeight: 500 }}>{value}</p>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 6px',
        fontSize: 10,
        color: '#6B6B6B',
        textTransform: 'uppercase',
        fontWeight: 800,
        letterSpacing: '0.15em',
      }}
    >
      {children}
    </p>
  )
}

// Shared styles
const selectStyle: React.CSSProperties = {
  padding: '12px 14px',
  border: `1.5px solid ${C.gray200}`,
  borderRadius: 2,
  fontSize: 14,
  background: '#fff',
  color: C.gray700,
  fontWeight: 500,
  cursor: 'pointer',
  outline: 'none',
}

const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  fontWeight: 800,
  color: '#fff',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

const tdStyle: React.CSSProperties = {
  padding: '16px',
  verticalAlign: 'middle',
}

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '80px 20px',
  background: '#fff',
  border: `1px solid ${C.gray200}`,
  borderRadius: 4,
}

function badgeStyle(bg: string, color: string): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: '5px 12px',
    background: bg,
    color: color,
    borderRadius: 2,
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    border: `1px solid ${color}`,
  }
}

function paginationBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '10px 16px',
    background: disabled ? C.gray100 : '#fff',
    color: disabled ? C.gray300 : C.nuit,
    border: `1.5px solid ${disabled ? C.gray200 : C.gray300}`,
    borderRadius: 2,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  }
}
