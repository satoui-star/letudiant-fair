'use client'
export const dynamic = 'force-dynamic'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toaster'
import Logo from '@/components/ui/Logo'

const STUDENT_LEVELS = ['Seconde', 'Première', 'Terminale', 'Bac+1', 'Bac+2', 'Bac+3 et +']
const STUDENT_SERIES = ['Générale', 'Technologique', 'Professionnelle']
const FILIERES = [
  'Droit et Sciences Politiques', 'Économie et Gestion', 'Commerce et Marketing',
  'Informatique et Numérique', 'Sciences et Technologies', 'Santé',
  'Lettres et Sciences Humaines', 'Arts et Culture', 'Social et Éducation',
]

function OnboardingInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { toast } = useToast()
  const role = params.get('role') ?? 'student'

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fairs, setFairs] = useState<{ id: string; name: string; city: string; event_date: string }[]>([])

  // Form state
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', dob: '',
    level: '', series: '', postalCode: '',
    filieres: [] as string[], selectedFair: '',
    optinLetudiant: false, optinCommercial: false, optinWax: false,
    // Teacher
    schoolName: '', teacherEmail: '',
  })

  useEffect(() => {
    async function loadFairs() {
      const { data } = await getSupabase().from('events').select('id, name, city, event_date').order('event_date')
      setFairs(data ?? [])
    }
    loadFairs()
  }, [])

  function update(key: string, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleFiliere(f: string) {
    setForm(prev => ({
      ...prev,
      filieres: prev.filieres.includes(f) ? prev.filieres.filter(x => x !== f) : [...prev.filieres, f]
    }))
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const supabase = getSupabase()
      const email = role === 'teacher' ? form.teacherEmail : form.email
      const name = `${form.firstName} ${form.lastName}`.trim()

      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: { name, role, education_level: form.level, bac_series: form.series },
        },
      })

      if (error) { toast(error.message, 'error'); setLoading(false); return }

      if (data.user) {
        await supabase.from('users').upsert({
          id: data.user.id,
          email,
          name: name || email,
          role: role as 'student' | 'teacher' | 'parent',
          dob: form.dob || null,
          education_level: form.level || null,
          bac_series: form.series || null,
          postal_code: form.postalCode || null,
          education_branches: form.filieres,
          optin_letudiant: form.optinLetudiant,
          optin_commercial: form.optinCommercial,
          optin_wax: form.optinWax,
          consent_date: new Date().toISOString(),
          orientation_stage: 'exploring',
          orientation_score: 0,
        })

        // Resolve pre-registration if this email was synced from Eventmaker
        if (role === 'student') {
          try {
            await supabase
              .from('pre_registrations')
              .update({ resolved_user_id: data.user.id, resolved_at: new Date().toISOString() })
              .eq('email', email.toLowerCase())
              .is('resolved_user_id', null)
          } catch {
            // Non-fatal — don't block account creation
          }
        }
      }

      toast('✓ Compte créé avec succès !', 'success')
      setTimeout(() => {
        if (role === 'teacher') router.push('/teacher/dashboard')
        else if (role === 'parent') router.push('/parent/home')
        else router.push('/home')
      }, 800)
    } catch (err) {
      toast('Erreur lors de la création du compte', 'error')
      setLoading(false)
    }
  }

  const inputStyle = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #E0E0E0', borderRadius: 12, padding: '13px 16px', fontSize: '0.9375rem', outline: 'none', fontFamily: 'inherit', color: '#1A1A1A', background: '#fff' }
  const labelStyle = { display: 'block' as const, fontSize: '0.8125rem', fontWeight: 600, color: '#4B4B4B', marginBottom: 6 }
  const btnPrimary = { width: '100%', background: '#E3001B', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }

  // Steps for student
  const totalSteps = role === 'student' ? 4 : 3

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#E3001B', padding: '24px 24px 32px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <Logo variant="inverted" size="md" />
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ height: 4, borderRadius: 2, background: i < step ? '#fff' : 'rgba(255,255,255,0.3)', flex: 1, maxWidth: 60, transition: 'background 0.3s' }} />
          ))}
        </div>
        <p style={{ textAlign: 'center', margin: '10px 0 0', fontSize: '0.8125rem', opacity: 0.8 }}>Étape {step}/{totalSteps}</p>
      </div>

      <div style={{ padding: '28px 24px', maxWidth: 480, margin: '0 auto' }}>

        {/* ─── STUDENT STEPS ─── */}
        {role === 'student' && (
          <>
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.375rem', fontWeight: 800 }}>Qui êtes-vous ?</h2>
                <p style={{ margin: '0 0 8px', color: '#6B6B6B', fontSize: '0.875rem' }}>Créez votre espace personnel L&apos;Étudiant</p>
                {[['Prénom', 'firstName'], ['Nom', 'lastName']].map(([label, key]) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input style={inputStyle} value={form[key as keyof typeof form] as string} onChange={e => update(key, e.target.value)} placeholder={label} />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="prenom.nom@email.com" />
                </div>
                <div>
                  <label style={labelStyle}>Mot de passe</label>
                  <input style={inputStyle} type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="8 caractères minimum" />
                </div>
                <div>
                  <label style={labelStyle}>Date de naissance</label>
                  <input style={inputStyle} type="date" value={form.dob} onChange={e => update('dob', e.target.value)} />
                </div>
                <button style={btnPrimary} onClick={() => {
                  if (!form.firstName || !form.email || !form.password) { toast('Merci de remplir tous les champs obligatoires', 'warning'); return }
                  if (form.password.length < 8) { toast('Le mot de passe doit faire au moins 8 caractères', 'warning'); return }
                  setStep(2)
                }}>Continuer →</button>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.375rem', fontWeight: 800 }}>Votre parcours</h2>
                <div>
                  <label style={labelStyle}>Niveau actuel</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {STUDENT_LEVELS.map(l => (
                      <button key={l} onClick={() => update('level', l)} style={{ padding: '10px 14px', border: `2px solid ${form.level === l ? '#E3001B' : '#E0E0E0'}`, borderRadius: 10, background: form.level === l ? '#FFF0F0' : '#fff', color: form.level === l ? '#E3001B' : '#4B4B4B', fontWeight: form.level === l ? 700 : 400, cursor: 'pointer', fontSize: '0.875rem' }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Série (si lycéen)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {STUDENT_SERIES.map(s => (
                      <button key={s} onClick={() => update('series', s)} style={{ flex: 1, padding: '10px', border: `2px solid ${form.series === s ? '#E3001B' : '#E0E0E0'}`, borderRadius: 10, background: form.series === s ? '#FFF0F0' : '#fff', color: form.series === s ? '#E3001B' : '#4B4B4B', fontWeight: form.series === s ? 700 : 400, cursor: 'pointer', fontSize: '0.8125rem' }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Code postal</label>
                  <input style={inputStyle} value={form.postalCode} onChange={e => update('postalCode', e.target.value)} placeholder="75001" maxLength={5} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{ ...btnPrimary, background: '#F0F0F0', color: '#4B4B4B', width: 'auto', padding: '14px 24px' }} onClick={() => setStep(1)}>← Retour</button>
                  <button style={{ ...btnPrimary }} onClick={() => { if (!form.level) { toast('Choisissez votre niveau', 'warning'); return } setStep(3) }}>Continuer →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.375rem', fontWeight: 800 }}>Vos centres d&apos;intérêt</h2>
                <p style={{ margin: '0 0 8px', color: '#6B6B6B', fontSize: '0.875rem' }}>Choisissez les filières qui vous intéressent</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {FILIERES.map(f => (
                    <button key={f} onClick={() => toggleFiliere(f)} style={{ padding: '8px 14px', border: `2px solid ${form.filieres.includes(f) ? '#E3001B' : '#E0E0E0'}`, borderRadius: 20, background: form.filieres.includes(f) ? '#FFF0F0' : '#fff', color: form.filieres.includes(f) ? '#E3001B' : '#4B4B4B', fontWeight: form.filieres.includes(f) ? 700 : 400, cursor: 'pointer', fontSize: '0.8125rem' }}>{f}</button>
                  ))}
                </div>
                {/* GDPR Consents */}
                <div style={{ background: '#F7F7F7', borderRadius: 14, padding: 16, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: '#1A1A1A' }}>Consentements (RGPD)</p>
                  {[
                    { key: 'optinLetudiant', label: "J'accepte de recevoir les communications de L'Étudiant (obligatoire)", required: true },
                    { key: 'optinCommercial', label: "J'accepte les offres commerciales de partenaires", required: false },
                    { key: 'optinWax', label: 'J\'accepte le suivi post-salon personnalisé (WAX)', required: false },
                  ].map(c => (
                    <label key={c.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form[c.key as keyof typeof form] as boolean} onChange={e => update(c.key, e.target.checked)} style={{ marginTop: 2, accentColor: '#E3001B', width: 16, height: 16 }} />
                      <span style={{ fontSize: '0.8125rem', color: '#4B4B4B', lineHeight: 1.5 }}>{c.label}{c.required && <span style={{ color: '#E3001B' }}> *</span>}</span>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{ ...btnPrimary, background: '#F0F0F0', color: '#4B4B4B', width: 'auto', padding: '14px 24px' }} onClick={() => setStep(2)}>← Retour</button>
                  <button style={btnPrimary} onClick={() => { if (!form.optinLetudiant) { toast('Veuillez accepter les communications L\'Étudiant', 'warning'); return } setStep(4) }}>Continuer →</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.375rem', fontWeight: 800 }}>Choisissez votre salon</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {fairs.length === 0 ? (
                    <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>Chargement des salons…</p>
                  ) : fairs.map(f => (
                    <button key={f.id} onClick={() => update('selectedFair', f.id)} style={{ padding: '14px 16px', border: `2px solid ${form.selectedFair === f.id ? '#E3001B' : '#E0E0E0'}`, borderRadius: 12, background: form.selectedFair === f.id ? '#FFF0F0' : '#fff', textAlign: 'left', cursor: 'pointer' }}>
                      <p style={{ margin: '0 0 3px', fontWeight: 700, color: form.selectedFair === f.id ? '#E3001B' : '#1A1A1A', fontSize: '0.9375rem' }}>{f.name}</p>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6B6B6B' }}>{f.city} · {new Date(f.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </button>
                  ))}
                </div>

                {/* Summary */}
                <div style={{ background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: 14, padding: 16 }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '0.9375rem', color: '#1A1A1A' }}>Récapitulatif</p>
                  <p style={{ margin: '0 0 3px', fontSize: '0.8125rem', color: '#4B4B4B' }}>{form.firstName} {form.lastName} · {form.email}</p>
                  <p style={{ margin: '0 0 3px', fontSize: '0.8125rem', color: '#4B4B4B' }}>{form.level}{form.series ? ` · Bac ${form.series}` : ''}</p>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#4B4B4B' }}>{form.filieres.length} filière{form.filieres.length !== 1 ? 's' : ''} sélectionnée{form.filieres.length !== 1 ? 's' : ''}</p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{ ...btnPrimary, background: '#F0F0F0', color: '#4B4B4B', width: 'auto', padding: '14px 24px' }} onClick={() => setStep(3)}>← Retour</button>
                  <button style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Création en cours…' : 'Créer mon espace →'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── TEACHER STEPS ─── */}
        {role === 'teacher' && (
          <>
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.375rem', fontWeight: 800 }}>Espace enseignant</h2>
                <p style={{ margin: '0 0 8px', color: '#6B6B6B', fontSize: '0.875rem' }}>Créez votre compte pour gérer votre groupe</p>
                {[['Prénom', 'firstName'], ['Nom', 'lastName'], ['Établissement scolaire', 'schoolName']].map(([label, key]) => (
                  <div key={key}>
                    <label style={labelStyle}>{label} <span style={{ color: '#E3001B' }}>*</span></label>
                    <input style={inputStyle} value={form[key as keyof typeof form] as string} onChange={e => update(key, e.target.value)} placeholder={label} />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Email professionnel <span style={{ color: '#E3001B' }}>*</span></label>
                  <input style={inputStyle} type="email" value={form.teacherEmail} onChange={e => update('teacherEmail', e.target.value)} placeholder="prenom.nom@etablissement.fr" />
                </div>
                <div>
                  <label style={labelStyle}>Mot de passe <span style={{ color: '#E3001B' }}>*</span></label>
                  <input style={inputStyle} type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="8 caractères minimum" />
                </div>
                <button style={btnPrimary} onClick={() => {
                  if (!form.firstName.trim()) { toast('Prénom requis', 'warning'); return }
                  if (!form.lastName.trim())  { toast('Nom requis', 'warning'); return }
                  if (!form.schoolName.trim()) { toast('Nom de l\'établissement requis', 'warning'); return }
                  if (!form.teacherEmail.includes('@')) { toast('Email professionnel invalide', 'warning'); return }
                  if (form.password.length < 8) { toast('Le mot de passe doit faire au moins 8 caractères', 'warning'); return }
                  setStep(2)
                }}>Continuer →</button>
              </div>
            )}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ margin: '0 0 8px', fontSize: '1.375rem', fontWeight: 800 }}>Choisissez votre salon</h2>
                <p style={{ margin: '0 0 4px', color: '#6B6B6B', fontSize: '0.875rem' }}>Sélectionnez le salon auquel vous participez</p>
                {fairs.length === 0 ? (
                  <p style={{ color: '#9B9B9B', fontSize: '0.875rem', padding: '12px 0' }}>Chargement des salons…</p>
                ) : fairs.map(f => (
                  <button key={f.id} onClick={() => update('selectedFair', f.id)} style={{ padding: '14px 16px', border: `2px solid ${form.selectedFair === f.id ? '#E3001B' : '#E0E0E0'}`, borderRadius: 12, background: form.selectedFair === f.id ? '#FFF0F0' : '#fff', textAlign: 'left', cursor: 'pointer' }}>
                    <p style={{ margin: '0 0 3px', fontWeight: 700, color: form.selectedFair === f.id ? '#E3001B' : '#1A1A1A' }}>{f.name}</p>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6B6B6B' }}>{f.city} · {new Date(f.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                  </button>
                ))}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{ ...btnPrimary, background: '#F0F0F0', color: '#4B4B4B', width: 'auto', padding: '14px 24px' }} onClick={() => setStep(1)}>← Retour</button>
                  <button style={btnPrimary} onClick={() => {
                    if (!form.selectedFair) { toast('Sélectionnez un salon pour continuer', 'warning'); return }
                    setStep(3)
                  }}>Continuer →</button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ margin: '0 0 8px', fontSize: '1.375rem', fontWeight: 800 }}>Confirmation</h2>
                <div style={{ background: '#F7F7F7', borderRadius: 14, padding: 16 }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 700 }}>Récapitulatif</p>
                  <p style={{ margin: '0 0 3px', fontSize: '0.875rem', color: '#4B4B4B' }}>{form.firstName} {form.lastName}</p>
                  <p style={{ margin: '0 0 3px', fontSize: '0.875rem', color: '#4B4B4B' }}>{form.schoolName}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#4B4B4B' }}>{form.teacherEmail}</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{ ...btnPrimary, background: '#F0F0F0', color: '#4B4B4B', width: 'auto', padding: '14px 24px' }} onClick={() => setStep(2)}>← Retour</button>
                  <button style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Création…' : 'Créer mon espace →'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── PARENT STEPS ─── */}
        {role === 'parent' && (
          <>
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ margin: '0 0 8px', fontSize: '1.375rem', fontWeight: 800 }}>Espace parent</h2>
                {[['Prénom', 'firstName'], ['Nom', 'lastName']].map(([label, key]) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input style={inputStyle} value={form[key as keyof typeof form] as string} onChange={e => update(key, e.target.value)} placeholder={label} />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="votre@email.com" />
                </div>
                <div>
                  <label style={labelStyle}>Mot de passe</label>
                  <input style={inputStyle} type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="8 caractères minimum" />
                </div>
                <button style={btnPrimary} onClick={() => setStep(2)}>Continuer →</button>
              </div>
            )}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ margin: '0 0 8px', fontSize: '1.375rem', fontWeight: 800 }}>Lier un enfant</h2>
                <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>Entrez l&apos;email de votre enfant — il recevra une invitation à valider.</p>
                <div>
                  <label style={labelStyle}>Email de votre enfant</label>
                  <input style={inputStyle} type="email" placeholder="enfant@email.com" />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{ ...btnPrimary, background: '#F0F0F0', color: '#4B4B4B', width: 'auto', padding: '14px 24px' }} onClick={() => setStep(1)}>← Retour</button>
                  <button style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Création…' : 'Créer mon espace →'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #E3001B', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <OnboardingInner />
    </Suspense>
  )
}
