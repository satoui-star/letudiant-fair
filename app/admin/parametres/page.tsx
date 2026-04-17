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

interface Settings {
  [key: string]: string | number | boolean
}

type TabId = 'general' | 'inscription' | 'salons' | 'integrations' | 'securite' | 'marque'

const TABS: { id: TabId; label: string; color: string; icon: string; desc: string }[] = [
  { id: 'general',      label: 'Général',      color: '#EC1F27', icon: '◆', desc: 'Nom, contact, fuseau horaire' },
  { id: 'inscription',  label: 'Inscription',  color: '#0066CC', icon: '✦', desc: 'Règles d\'accès et consentement' },
  { id: 'salons',       label: 'Salons',       color: '#FCD716', icon: '◉', desc: 'Durée, fonctionnalités, scans' },
  { id: 'integrations', label: 'Intégrations', color: '#FF6B35', icon: '⬡', desc: 'APIs externes et endpoints' },
  { id: 'securite',     label: 'Sécurité',     color: '#932D99', icon: '▲', desc: 'Sessions, 2FA, audit' },
  { id: 'marque',       label: 'Marque',       color: '#4DB8A8', icon: '●', desc: 'Identité visuelle et couleurs' },
]

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general')
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

  const activeTabData = TABS.find(t => t.id === activeTab)!

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.blanc }}>
        <div style={{ height: 6, background: `linear-gradient(90deg, ${C.tomate} 0 33%, ${C.piscine} 33% 66%, ${C.citron} 66% 100%)` }} />
        <div style={{ padding: '80px 48px', textAlign: 'center', color: C.gray500, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
          Chargement...
        </div>
      </div>
    )
  }

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
          <div style={{ display: 'inline-block', position: 'relative', paddingBottom: 8, marginBottom: 16 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: C.gray500,
              }}
            >
              Administration — Configuration
            </span>
            <div style={{ position: 'absolute', left: 0, bottom: 0, width: 28, height: 3, background: C.tomate }} />
          </div>

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
            Paramètres
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 16, color: C.gray500, maxWidth: 640, lineHeight: 1.5 }}>
            Configurez l'ensemble de la plateforme <strong style={{ color: C.nuit }}>L'Étudiant Fair</strong> — règles, intégrations, sécurité et identité de marque.
          </p>
        </div>

        {/* Notification */}
        {message && (
          <div
            style={{
              padding: '14px 20px',
              background: message.type === 'success' ? C.mentheLight : C.tomateLight,
              color: message.type === 'success' ? C.menthe : C.tomate,
              border: `1.5px solid ${message.type === 'success' ? C.menthe : C.tomate}`,
              borderLeft: `6px solid ${message.type === 'success' ? C.menthe : C.tomate}`,
              borderRadius: 2,
              marginBottom: 24,
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 18 }}>{message.type === 'success' ? '✓' : '✕'}</span>
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, alignItems: 'flex-start' }}>
          {/* Tabs Sidebar */}
          <aside>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: C.gray500,
                marginBottom: 12,
                paddingLeft: 4,
              }}
            >
              Sections
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '14px 16px',
                      textAlign: 'left',
                      border: 'none',
                      background: isActive ? '#fff' : 'transparent',
                      borderLeft: `4px solid ${isActive ? tab.color : 'transparent'}`,
                      cursor: 'pointer',
                      borderRadius: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'background 0.15s',
                      boxShadow: isActive ? '0 1px 3px rgba(25, 24, 41, 0.06)' : 'none',
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = C.gray100 }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span
                      style={{
                        fontSize: 18,
                        color: tab.color,
                        width: 20,
                        textAlign: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {tab.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? 800 : 700,
                          color: isActive ? C.nuit : C.gray700,
                          letterSpacing: '0.02em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {tab.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: C.gray500,
                          marginTop: 2,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tab.desc}
                      </div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Content Panel */}
          <div>
            <section
              style={{
                background: '#fff',
                border: `1px solid ${C.gray200}`,
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  padding: '24px 28px 20px',
                  borderBottom: `1px solid ${C.gray200}`,
                  borderTop: `4px solid ${activeTabData.color}`,
                  background: C.blanc,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: activeTabData.color,
                    marginBottom: 4,
                  }}
                >
                  Section {TABS.findIndex(t => t.id === activeTab) + 1} / {TABS.length}
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 900,
                    color: C.nuit,
                    letterSpacing: '-0.02em',
                    textTransform: 'uppercase',
                  }}
                >
                  {activeTabData.label}
                </h2>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: C.gray500 }}>
                  {activeTabData.desc}
                </p>
              </div>

              <div style={{ padding: '28px' }}>
                {/* Général */}
                {activeTab === 'general' && (
                  <div style={fieldGroupStyle}>
                    <TextField label="Nom de l'organisation" value={settings.organization_name as string || ''} onChange={(v) => updateSetting('organization_name', v)} />
                    <TextField label="Email de support" type="email" value={settings.support_email as string || ''} onChange={(v) => updateSetting('support_email', v)} />
                    <SelectField label="Fuseau horaire" value={settings.timezone as string || 'Europe/Paris'} onChange={(v) => updateSetting('timezone', v)} options={[
                      { value: 'Europe/Paris', label: 'Europe/Paris (UTC+1)' },
                      { value: 'Europe/London', label: 'Europe/London (UTC+0)' },
                      { value: 'Europe/Berlin', label: 'Europe/Berlin (UTC+1)' },
                    ]} />
                    <ToggleField label="Activer le mode sombre" checked={settings.dark_mode === true || settings.dark_mode === 'true'} onChange={(v) => updateSetting('dark_mode', v)} color={C.nuit} />
                  </div>
                )}

                {/* Inscription */}
                {activeTab === 'inscription' && (
                  <div style={fieldGroupStyle}>
                    <TextField label="Âge minimum (en années)" type="number" value={String(settings.min_age || 16)} onChange={(v) => updateSetting('min_age', parseInt(v))} />
                    <ToggleField label="Consentement parental obligatoire" checked={settings.require_parent_consent === true || settings.require_parent_consent === 'true'} onChange={(v) => updateSetting('require_parent_consent', v)} color={C.piscine} />
                    <ToggleField label="Sélection d'école obligatoire" checked={settings.require_school_selection === true || settings.require_school_selection === 'true'} onChange={(v) => updateSetting('require_school_selection', v)} color={C.piscine} />
                    <TextareaField label="Texte de RGPD" value={settings.gdpr_text as string || ''} onChange={(v) => updateSetting('gdpr_text', v)} />
                  </div>
                )}

                {/* Salons */}
                {activeTab === 'salons' && (
                  <div style={fieldGroupStyle}>
                    <TextField label="Durée moyenne d'un salon (heures)" type="number" value={String(settings.fair_duration_hours || 8)} onChange={(v) => updateSetting('fair_duration_hours', parseInt(v))} />
                    <TextField label="Délai de clôture (jours)" type="number" value={String(settings.fair_closure_days || 30)} onChange={(v) => updateSetting('fair_closure_days', parseInt(v))} />
                    <ToggleField label="Activer les scans QR" checked={settings.enable_qr_scanning === true || settings.enable_qr_scanning === 'true'} onChange={(v) => updateSetting('enable_qr_scanning', v)} color={C.citron} />
                    <ToggleField label="Activer le matching par swipe" checked={settings.enable_swipe_matching === true || settings.enable_swipe_matching === 'true'} onChange={(v) => updateSetting('enable_swipe_matching', v)} color={C.citron} />
                  </div>
                )}

                {/* Intégrations */}
                {activeTab === 'integrations' && (
                  <div style={fieldGroupStyle}>
                    <TextField label="Clé API Supabase" type="password" placeholder="••••••••••••••••" value={settings.supabase_key as string || ''} onChange={(v) => updateSetting('supabase_key', v)} />
                    <TextField label="URL Cloudflare Stream" type="url" value={settings.cloudflare_url as string || ''} onChange={(v) => updateSetting('cloudflare_url', v)} />
                    <TextField label="Endpoint EventMaker" type="url" value={settings.eventmaker_endpoint as string || ''} onChange={(v) => updateSetting('eventmaker_endpoint', v)} />
                  </div>
                )}

                {/* Sécurité */}
                {activeTab === 'securite' && (
                  <div style={fieldGroupStyle}>
                    <TextField label="Durée de session (minutes)" type="number" value={String(settings.session_timeout || 30)} onChange={(v) => updateSetting('session_timeout', parseInt(v))} />
                    <ToggleField label="Activer l'authentification à deux facteurs" checked={settings.require_2fa === true || settings.require_2fa === 'true'} onChange={(v) => updateSetting('require_2fa', v)} color={C.pourpre} />
                    <ToggleField label="Activer les journaux d'audit" checked={settings.enable_audit_logging === true || settings.enable_audit_logging === 'true'} onChange={(v) => updateSetting('enable_audit_logging', v)} color={C.pourpre} />
                  </div>
                )}

                {/* Marque */}
                {activeTab === 'marque' && (
                  <div style={fieldGroupStyle}>
                    <ColorField label="Couleur primaire" value={(settings.primary_color as string) || C.tomate} onChange={(v) => updateSetting('primary_color', v)} />
                    <ColorField label="Couleur secondaire" value={(settings.secondary_color as string) || C.piscine} onChange={(v) => updateSetting('secondary_color', v)} />
                    <TextField label="Logo URL" type="url" value={settings.logo_url as string || ''} onChange={(v) => updateSetting('logo_url', v)} />
                  </div>
                )}
              </div>
            </section>

            {/* Save Actions */}
            <div
              style={{
                marginTop: 24,
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={fetchSettings}
                style={{
                  padding: '12px 24px',
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
                Annuler
              </button>
              <button
                onClick={saveSettings}
                disabled={saving}
                style={{
                  padding: '12px 28px',
                  background: saving ? C.gray300 : C.tomate,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 2,
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = C.tomateDark }}
                onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = C.tomate }}
              >
                {saving ? 'Sauvegarde...' : '✓ Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Field components
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: 'block',
        marginBottom: 8,
        fontWeight: 800,
        fontSize: 11,
        color: C.nuit,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}
    >
      {children}
    </label>
  )
}

function TextField({ label, type = 'text', value, onChange, placeholder }: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={(e) => (e.currentTarget.style.borderColor = C.tomate)}
        onBlur={(e) => (e.currentTarget.style.borderColor = C.gray200)}
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
        {options.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </div>
  )
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, minHeight: 120, fontFamily: 'inherit', resize: 'vertical' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = C.tomate)}
        onBlur={(e) => (e.currentTarget.style.borderColor = C.gray200)}
      />
    </div>
  )
}

function ToggleField({ label, checked, onChange, color }: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  color: string
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        padding: '14px 16px',
        background: checked ? C.blanc : 'transparent',
        border: `1.5px solid ${checked ? color : C.gray200}`,
        borderRadius: 2,
        transition: 'all 0.15s',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 44,
          height: 24,
          background: checked ? color : C.gray300,
          borderRadius: 12,
          transition: 'background 0.15s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 22 : 2,
            width: 20,
            height: 20,
            background: '#fff',
            borderRadius: '50%',
            transition: 'left 0.15s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ display: 'none' }} />
      <span style={{ color: C.nuit, fontWeight: 600, fontSize: 14, flex: 1 }}>{label}</span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: checked ? color : C.gray500,
        }}
      >
        {checked ? 'Activé' : 'Désactivé'}
      </span>
    </label>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        <div
          style={{
            width: 56,
            background: value,
            border: `1.5px solid ${C.gray200}`,
            borderRadius: 2,
            position: 'relative',
            cursor: 'pointer',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: '100%', height: '100%', border: 'none', cursor: 'pointer', opacity: 0 }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = C.tomate)}
          onBlur={(e) => (e.currentTarget.style.borderColor = C.gray200)}
        />
      </div>
    </div>
  )
}

// Shared styles
const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: `1.5px solid ${C.gray200}`,
  borderRadius: 2,
  fontSize: 14,
  color: C.nuit,
  background: '#fff',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s',
}
