'use client'

/**
 * Booth Capture Form V2 with School Recommendations
 *
 * Features:
 * 1. Capture basic orientation (existing Q1-Q3)
 * 2. Collect academic performance (numeric 0-20 scale)
 * 3. Collect Bac specialty
 * 4. Collect school preferences (optional)
 * 5. Call /api/booth/recommendations
 * 6. Display top-3 schools instantly on tablet
 */

import { useState } from 'react'
import { getGradeLabel } from '@/lib/scoring/schoolRecommendation'
import type { RecommendationResult } from '@/lib/scoring/schoolRecommendation'

interface BoothCaptureFormV2Props {
  eventId: string
  /**
   * Capture source.
   *  - 'score_booth' (default): central L'Étudiant booth, no stand_id, requires
   *    operator auth on the API side.
   *  - 'school_booth' (legacy): per-school booth — requires standId.
   */
  source?: 'score_booth' | 'school_booth'
  /** Required only when source === 'school_booth'. */
  standId?: string
  currentEducationLevel?: string // Pre-filled from app profile
  educationBranches?: string[] // Pre-filled from app profile
  onSuccess?: (captureId: string) => void
  onError?: (message: string) => void
}

type FormStep = 'orientation' | 'grades' | 'specialty' | 'preferences' | 'recommendations'

const BAC_SPECIALTIES = [
  'Maths',
  'Physique-Chimie',
  'SVT',
  'Histoire-Géo',
  'Philosophie',
  'Littérature',
]

const EDUCATION_BRANCHES = [
  'Ingénierie',
  'Informatique',
  'Commerce',
  'Droit',
  'Santé',
  'Sciences',
  'Autre',
]

export default function BoothCaptureFormV2({
  eventId,
  source = 'score_booth',
  standId,
  currentEducationLevel: preFillEducationLevel,
  educationBranches: preFillBranches,
  onSuccess,
  onError,
}: BoothCaptureFormV2Props) {
  // Sanity guard — caller misuse should fail loudly rather than silently
  // submit an invalid capture.
  if (source === 'school_booth' && !standId) {
    throw new Error(
      "BoothCaptureFormV2: source='school_booth' requires a standId prop"
    )
  }
  // ─── State Management ──────────────────────────────────────────────────

  const [step, setStep] = useState<FormStep>('orientation')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [orientationStage, setOrientationStage] = useState('')
  const [currentEducationLevel, setCurrentEducationLevel] = useState(
    preFillEducationLevel || ''
  )
  const [educationBranches, setEducationBranches] = useState<string[]>(
    preFillBranches || []
  )
  const [academicGrade, setAcademicGrade] = useState<number>(12)
  const [bacSpecialties, setBacSpecialties] = useState<string[]>([])
  const [schoolPreferences, setSchoolPreferences] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [optinContact, setOptinContact] = useState(false)

  // Recommendations
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([])
  const [captureId, setCaptureId] = useState<string | null>(null)

  // ─── Handler: Toggle education branch ──────────────────────────────────

  const toggleBranch = (branch: string) => {
    setEducationBranches((prev) =>
      prev.includes(branch) ? prev.filter((b) => b !== branch) : [...prev, branch]
    )
  }

  // ─── Handler: Toggle Bac specialty ────────────────────────────────────

  const toggleSpecialty = (specialty: string) => {
    setBacSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    )
  }

  // ─── Handler: Step progression ────────────────────────────────────────

  const handleNext = () => {
    setError(null)

    if (step === 'orientation') {
      if (!orientationStage || !currentEducationLevel || educationBranches.length === 0) {
        setError('Veuillez compléter toutes les questions d\'orientation')
        return
      }
      setStep('grades')
    } else if (step === 'grades') {
      if (academicGrade === null) {
        setError('Veuillez indiquer la note académique')
        return
      }
      setStep('specialty')
    } else if (step === 'specialty') {
      setStep('preferences')
    } else if (step === 'preferences') {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (step === 'recommendations') {
      resetForm()
    } else if (step !== 'orientation') {
      setStep(
        step === 'grades'
          ? 'orientation'
          : step === 'specialty'
            ? 'grades'
            : 'specialty'
      )
    }
  }

  // ─── Handler: Submit form & get recommendations ────────────────────────

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Step 1: Save booth capture
      const captureBody: Record<string, unknown> = {
        event_id: eventId,
        source,
        orientation_stage: orientationStage,
        education_level: [currentEducationLevel],
        education_branches: educationBranches,
        // Note: academic / bac / preferences fields are recommendation-only,
        // they're not stored on booth_captures and are forwarded in step 2.
        email: email || null,
        phone: phone || null,
        optin_contact: optinContact,
      }
      if (source === 'school_booth') {
        captureBody.stand_id = standId
      }

      const captureRes = await fetch('/api/booth/capture-orientation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(captureBody),
      })

      if (!captureRes.ok) {
        throw new Error('Erreur lors de la sauvegarde')
      }

      const captureData = await captureRes.json()
      if (!captureData.success) {
        throw new Error(captureData.message)
      }

      setCaptureId(captureData.capture_id)

      // Step 2: Get recommendations (and link them to the capture row)
      const recRes = await fetch('/api/booth/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          capture_id: captureData.capture_id,
          current_education_level: currentEducationLevel,
          education_branches: educationBranches,
          booth_academic_level: academicGrade,
          bac_specialty: bacSpecialties,
          school_preferences: schoolPreferences ? [schoolPreferences] : [],
        }),
      })

      if (!recRes.ok) {
        throw new Error('Erreur lors du calcul des recommandations')
      }

      const recData = await recRes.json()
      if (recData.success) {
        setRecommendations(recData.recommendations)
        setStep('recommendations')

        if (onSuccess) {
          onSuccess(captureData.capture_id)
        }
      } else {
        throw new Error(recData.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      if (onError) {
        onError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  // ─── Handler: Reset form ──────────────────────────────────────────────

  const resetForm = () => {
    setStep('orientation')
    setOrientationStage('')
    setCurrentEducationLevel(preFillEducationLevel || '')
    setEducationBranches(preFillBranches || [])
    setAcademicGrade(12)
    setBacSpecialties([])
    setSchoolPreferences('')
    setEmail('')
    setPhone('')
    setOptinContact(false)
    setRecommendations([])
    setCaptureId(null)
    setError(null)
  }

  // ─── Render: Orientation Step ────────────────────────────────────────

  if (step === 'orientation') {
    return (
      <div style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.125rem', fontWeight: 700 }}>
            1️⃣ Orientation
          </h2>

          {/* Q1: Orientation Stage */}
          <label style={{ display: 'block', marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 600, color: '#1A1A1A' }}>
              Où en es-tu dans ton projet ?
            </div>
            {['exploring', 'comparing', 'deciding'].map((stage) => (
              <label
                key={stage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 8,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="orientation_stage"
                  value={stage}
                  checked={orientationStage === stage}
                  onChange={(e) => setOrientationStage(e.target.value)}
                  style={{ marginRight: 8 }}
                />
                <span style={{ color: '#3D3D3D' }}>
                  {{
                    exploring: '🔵 J\'explore les possibilités',
                    comparing: '🟡 Je compare les options',
                    deciding: '🟢 Je suis en train de décider',
                  }[stage as keyof typeof stage]}
                </span>
              </label>
            ))}
          </label>

          {/* Q2: Current Education Level */}
          <label style={{ display: 'block', marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 600, color: '#1A1A1A' }}>
              En quelle classe es-tu cette année ?
            </div>
            <select
              value={currentEducationLevel}
              onChange={(e) => setCurrentEducationLevel(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #E8E8E8',
                borderRadius: 5,
                fontSize: '0.9375rem',
                color: '#3D3D3D',
              }}
            >
              <option value="">Sélectionne...</option>
              <optgroup label="Collégien">
                <option value="3ème">3ème</option>
                <option value="4ème">4ème</option>
                <option value="5ème">5ème</option>
                <option value="6ème">6ème</option>
              </optgroup>
              <optgroup label="Lycéen">
                <option value="2nde">2nde</option>
                <option value="1ère">1ère</option>
                <option value="Terminale">Terminale</option>
              </optgroup>
              <optgroup label="Étudiant">
                <option value="Bac+1">Bac+1</option>
                <option value="Bac+2">Bac+2</option>
                <option value="Bac+3">Bac+3</option>
                <option value="Bac+4">Bac+4</option>
                <option value="Bac+5">Bac+5</option>
              </optgroup>
            </select>
          </label>

          {/* Q3: Education Branches */}
          <label style={{ display: 'block', marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 600, color: '#1A1A1A' }}>
              Quels domaines t'intéressent ?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {EDUCATION_BRANCHES.map((branch) => (
                <label
                  key={branch}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={educationBranches.includes(branch)}
                    onChange={() => toggleBranch(branch)}
                    style={{ marginRight: 6 }}
                  />
                  <span style={{ color: '#3D3D3D', fontSize: '0.875rem' }}>
                    {branch}
                  </span>
                </label>
              ))}
            </div>
          </label>

          {error && (
            <div
              style={{
                background: '#FEE2E2',
                color: '#991B1B',
                padding: 12,
                borderRadius: 6,
                fontSize: '0.875rem',
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleNext}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#E3001B',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Suivant →
          </button>
        </div>
      </div>
    )
  }

  // ─── Render: Grades Step ───────────────────────────────────────────────

  if (step === 'grades') {
    return (
      <div style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.125rem', fontWeight: 700 }}>
            2️⃣ Performance académique
          </h2>

          <label style={{ display: 'block', marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 600, color: '#1A1A1A' }}>
              Quelle est ta moyenne académique ? (Échelle 0-20)
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 16,
              }}
            >
              <input
                type="range"
                min="0"
                max="20"
                value={academicGrade}
                onChange={(e) => setAcademicGrade(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#E3001B' }}>
                  {academicGrade}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>
                  {getGradeLabel(academicGrade)}
                </div>
              </div>
            </div>
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'transparent',
                color: '#E3001B',
                border: '1.5px solid #E3001B',
                borderRadius: 5,
                fontSize: '0.9375rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← Retour
            </button>
            <button
              onClick={handleNext}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: '#E3001B',
                color: 'white',
                border: 'none',
                borderRadius: 5,
                fontSize: '0.9375rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Suivant →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: Bac Specialty Step ────────────────────────────────────────

  if (step === 'specialty') {
    return (
      <div style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.125rem', fontWeight: 700 }}>
            3️⃣ Spécialisation Bac (optionnel)
          </h2>

          <label style={{ display: 'block', marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 600, color: '#1A1A1A' }}>
              Tes spécialités Bac :
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {BAC_SPECIALTIES.map((spec) => (
                <label
                  key={spec}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={bacSpecialties.includes(spec)}
                    onChange={() => toggleSpecialty(spec)}
                    style={{ marginRight: 6 }}
                  />
                  <span style={{ color: '#3D3D3D', fontSize: '0.875rem' }}>
                    {spec}
                  </span>
                </label>
              ))}
            </div>
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'transparent',
                color: '#E3001B',
                border: '1.5px solid #E3001B',
                borderRadius: 5,
                fontSize: '0.9375rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← Retour
            </button>
            <button
              onClick={handleNext}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: '#E3001B',
                color: 'white',
                border: 'none',
                borderRadius: 5,
                fontSize: '0.9375rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Suivant →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: Preferences & Contact Step ────────────────────────────────

  if (step === 'preferences') {
    return (
      <div style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.125rem', fontWeight: 700 }}>
            4️⃣ Coordonnées (optionnel)
          </h2>

          <label style={{ display: 'block', marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 600, color: '#1A1A1A' }}>
              Écoles d'intérêt (nom libre) :
            </div>
            <input
              type="text"
              placeholder="Ex: Telecom Paris, HEC, ..."
              value={schoolPreferences}
              onChange={(e) => setSchoolPreferences(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #E8E8E8',
                borderRadius: 5,
                fontSize: '0.9375rem',
                color: '#3D3D3D',
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 600, color: '#1A1A1A' }}>
              Pouvons-nous te contacter ? (optionnel)
            </div>

            <label style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={optinContact}
                onChange={(e) => setOptinContact(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              <span style={{ color: '#3D3D3D' }}>Oui, j'accepte le contact</span>
            </label>

            {optinContact && (
              <>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #E8E8E8',
                    borderRadius: 5,
                    fontSize: '0.9375rem',
                    marginBottom: 8,
                  }}
                />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #E8E8E8',
                    borderRadius: 5,
                    fontSize: '0.9375rem',
                  }}
                />
              </>
            )}
          </label>

          {error && (
            <div
              style={{
                background: '#FEE2E2',
                color: '#991B1B',
                padding: 12,
                borderRadius: 6,
                fontSize: '0.875rem',
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'transparent',
                color: '#E3001B',
                border: '1.5px solid #E3001B',
                borderRadius: 5,
                fontSize: '0.9375rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← Retour
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: loading ? '#ccc' : '#E3001B',
                color: 'white',
                border: 'none',
                borderRadius: 5,
                fontSize: '0.9375rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Calcul...' : '✅ Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: Recommendations Step ──────────────────────────────────────

  if (step === 'recommendations') {
    return (
      <div style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#E3001B',
            }}
          >
            ✅ Recommandations
          </h2>
          <p style={{ margin: '0 0 24px', color: '#6B6B6B', fontSize: '0.875rem' }}>
            Top 3 écoles adaptées à ton profil
          </p>

          {recommendations.length === 0 ? (
            <div
              style={{
                background: '#E6ECF8',
                border: '1px solid #003C8F',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
                color: '#003C8F',
              }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>
                Aucune recommandation disponible
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '0.875rem' }}>
                Verifie que les écoles ont rempli leurs profils
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
              {recommendations.map((rec, idx) => (
                <div
                  key={rec.school_id}
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #E8E8E8',
                    borderRadius: 8,
                    padding: 16,
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'start',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#1A1A1A',
                        flex: 1,
                      }}
                    >
                      #{idx + 1} {rec.school_name}
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginLeft: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '1.5rem',
                          lineHeight: 1,
                        }}
                      >
                        {rec.tier === 'strong'
                          ? '🟢'
                          : rec.tier === 'moderate'
                            ? '🟡'
                            : '🔴'}
                      </span>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: '#E3001B',
                        }}
                      >
                        {rec.fit_score}%
                      </div>
                    </div>
                  </div>

                  <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: '#6B6B6B' }}>
                    {rec.reason}
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      fontSize: '0.75rem',
                      color: '#3D3D3D',
                    }}
                  >
                    <div>
                      <strong>Domaines:</strong>{' '}
                      {Math.round(rec.component_scores.domain_relevance * 100)}%
                    </div>
                    <div>
                      <strong>Academic:</strong>{' '}
                      {Math.round(rec.component_scores.academic_feasibility * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: '0.75rem', color: '#6B6B6B', marginBottom: 24 }}>
            <p style={{ margin: '0 0 8px' }}>
              💾 Données enregistrées pour suivi post-salon
            </p>
            <p style={{ margin: 0 }}>
              Cliquez sur « Nouveau Scan » lorsque vous êtes prêt·e.
            </p>
          </div>

          <button
            onClick={handleBack}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#003C8F',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              fontSize: '0.9375rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ↻ Nouveau Scan
          </button>
        </div>
      </div>
    )
  }

  return null
}
