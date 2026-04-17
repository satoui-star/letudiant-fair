'use client'
import { useEffect, useState } from 'react'

const C = {
  red: '#E3001B', redLight: '#FDEAEA',
  blue: '#003C8F', blueLight: '#E6ECF8',
  yellow: '#FFD100', yellowLight: '#FFFBE6',
  gray900: '#1A1A1A', gray700: '#3D3D3D', gray500: '#6B6B6B',
  gray200: '#E8E8E8', gray100: '#F4F4F4',
}

interface Settings {
  [key: string]: string | number | boolean
}

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'inscription' | 'salons' | 'integrations' | 'securite' | 'marque'>('general')
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      setSettings(data.data || {})
    } catch (err) {
      console.error('Failed to fetch settings:', err)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des paramètres' })
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Paramètres sauvegardés avec succès' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center', color: C.gray500 }}>Chargement...</div>
  }

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: C.gray900 }}>Paramètres</h1>
        <p style={{ margin: 0, fontSize: 14, color: C.gray500 }}>Configurez la plateforme L'Étudiant Fair</p>
      </div>

      {/* Notification */}
      {message && (
        <div
          style={{
            padding: '12px 16px',
            background: message.type === 'success' ? '#D4EDDA' : '#F8D7DA',
            color: message.type === 'success' ? '#155724' : '#721C24',
            borderRadius: 6,
            marginBottom: 24,
            fontSize: 14,
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Tabs Sidebar */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { id: 'general', label: 'Général' },
              { id: 'inscription', label: 'Inscription' },
              { id: 'salons', label: 'Salons' },
              { id: 'integrations', label: 'Intégrations' },
              { id: 'securite', label: 'Sécurité' },
              { id: 'marque', label: 'Marque' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  border: 'none',
                  background: activeTab === tab.id ? C.gray100 : 'transparent',
                  color: activeTab === tab.id ? C.red : C.gray700,
                  borderLeft: activeTab === tab.id ? `3px solid ${C.red}` : '3px solid transparent',
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  cursor: 'pointer',
                  borderRadius: '0 6px 6px 0',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {/* Général */}
          {activeTab === 'general' && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.gray200}` }}>
              <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: C.gray900 }}>Paramètres généraux</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: C.gray900 }}>
                    Nom de l'organisation
                  </label>
                  <input
                    type="text"
                    value={settings.organization_name || ''}
                    onChange={(e) => updateSetting('organization_name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: C.gray900 }}>
                    Email de support
                  </label>
                  <input
                    type="email"
                    value={settings.support_email || ''}
                    onChange={(e) => updateSetting('support_email', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: C.gray900 }}>
                    Fuseau horaire
                  </label>
                  <select
                    value={settings.timezone || 'Europe/Paris'}
                    onChange={(e) => updateSetting('timezone', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 6,
                      fontSize: 14,
                      background: '#fff',
                    }}
                  >
                    <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                    <option value="Europe/London">Europe/London (UTC+0)</option>
                    <option value="Europe/Berlin">Europe/Berlin (UTC+1)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={settings.dark_mode === true || settings.dark_mode === 'true'}
                      onChange={(e) => updateSetting('dark_mode', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: C.gray900, fontWeight: 500 }}>Activer le mode sombre</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Inscription */}
          {activeTab === 'inscription' && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.gray200}` }}>
              <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: C.gray900 }}>Paramètres d'inscription</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: C.gray900 }}>
                    Âge minimum (en années)
                  </label>
                  <input
                    type="number"
                    value={settings.min_age || 16}
                    onChange={(e) => updateSetting('min_age', parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={settings.require_parent_consent === true || settings.require_parent_consent === 'true'}
                      onChange={(e) => updateSetting('require_parent_consent', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: C.gray900, fontWeight: 500 }}>Consentement parental obligatoire</span>
                  </label>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={settings.require_school_selection === true || settings.require_school_selection === 'true'}
                      onChange={(e) => updateSetting('require_school_selection', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: C.gray900, fontWeight: 500 }}>Sélection d'école obligatoire</span>
                  </label>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: C.gray900 }}>
                    Texte de RGPD
                  </label>
                  <textarea
                    value={settings.gdpr_text || ''}
                    onChange={(e) => updateSetting('gdpr_text', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 6,
                      fontSize: 14,
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      minHeight: 120,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Salons */}
          {activeTab === 'salons' && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.gray200}` }}>
              <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: C.gray900 }}>Configuration des salons</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: C.gray900 }}>
                    Durée moyenne d'un salon (heures)
                  </label>
                  <input
                    type="number"
                    value={settings.fair_duration_hours || 8}
                    onChange={(e) => updateSetting('fair_duration_hours', parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: C.gray900 }}>
                    Délai de clôture (jours)
                  </label>
                  <input
                    type="number"
                    value={settings.fair_closure_days || 30}
                    onChange={(e) => updateSetting('fair_closure_days', parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={settings.enable_qr_scanning === true || settings.enable_qr_scanning === 'true'}
                      onChange={(e) => updateSetting('enable_qr_scanning', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: C.gray900, fontWeight: 500 }}>Activer les scans QR</span>
                  </label>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={settings.enable_swipe_matching === true || settings.enable_swipe_matching === 'true'}
                      onChange={(e) => updateSetting('enable_swipe_matching', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: C.gray900, fontWeight: 500 }}>Activer le matching par swipe</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Intégrations */}
          {activeTab === 'integrations' && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.gray200}` }}>
              <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: C.gray900 }}>Intégrations</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: C.gray900 }}>
                    Clé API Supabase
                  </label>
                  <input
                    type="password"
                    value={settings.supabase_key || ''}
                    onChange={(e) => updateSetting('supabase_key', e.target.value)}
                    placeholder="••••••••••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: C.gray900 }}>
                    URL Cloudflare Stream
                  </label>
                  <input
                    type="url"
                    value={settings.cloudflare_url || ''}
                    onChange={(e) => updateSetting('cloudflare_url', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: C.gray900 }}>
                    Endpoint EventMaker
                  </label>
                  <input
                    type="url"
                    value={settings.eventmaker_endpoint || ''}
                    onChange={(e) => updateSetting('eventmaker_endpoint', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sécurité */}
          {activeTab === 'securite' && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.gray200}` }}>
              <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: C.gray900 }}>Sécurité</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: C.gray900 }}>
                    Durée de session (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.session_timeout || 30}
                    onChange={(e) => updateSetting('session_timeout', parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={settings.require_2fa === true || settings.require_2fa === 'true'}
                      onChange={(e) => updateSetting('require_2fa', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: C.gray900, fontWeight: 500 }}>Activer l'authentification à deux facteurs</span>
                  </label>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={settings.enable_audit_logging === true || settings.enable_audit_logging === 'true'}
                      onChange={(e) => updateSetting('enable_audit_logging', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: C.gray900, fontWeight: 500 }}>Activer les journaux d'audit</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Marque */}
          {activeTab === 'marque' && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: `1px solid ${C.gray200}` }}>
              <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: C.gray900 }}>Paramètres de marque</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: C.gray900 }}>
                    Couleur primaire (hex)
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      type="color"
                      value={settings.primary_color || C.red}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      style={{
                        width: 60,
                        height: 40,
                        border: `1px solid ${C.gray200}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    />
                    <input
                      type="text"
                      value={settings.primary_color || C.red}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: `1px solid ${C.gray200}`,
                        borderRadius: 6,
                        fontSize: 14,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: C.gray900 }}>
                    Couleur secondaire (hex)
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      type="color"
                      value={settings.secondary_color || C.blue}
                      onChange={(e) => updateSetting('secondary_color', e.target.value)}
                      style={{
                        width: 60,
                        height: 40,
                        border: `1px solid ${C.gray200}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    />
                    <input
                      type="text"
                      value={settings.secondary_color || C.blue}
                      onChange={(e) => updateSetting('secondary_color', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: `1px solid ${C.gray200}`,
                        borderRadius: 6,
                        fontSize: 14,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: C.gray900 }}>
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={settings.logo_url || ''}
                    onChange={(e) => updateSetting('logo_url', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={fetchSettings}
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
              Annuler
            </button>
            <button
              onClick={saveSettings}
              disabled={saving}
              style={{
                padding: '10px 20px',
                background: C.red,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
