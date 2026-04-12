// ─── Intent Level Scoring ─────────────────────────────────────────────────────
// Inferred entirely from behavioral signals — never self-declared by the student.
// Score is computed and stored on public.users (intent_score, intent_level).
// Updated after each significant action (scan, swipe, RDV, conference check-in).

export type IntentLevel = 'low' | 'medium' | 'high'

export interface IntentSignals {
  hasEducationLevel: boolean    // profile: education_level is set
  hasRealEmail: boolean         // not a generated guest email (@group.letudiant-salons.fr)
  standScanCount: number        // scans WHERE channel = 'stand'
  swipeRightCount: number       // matches WHERE student_swipe = 'right'
  appointmentBooked: boolean    // at least one appointment (status ≠ cancelled)
  conferenceCount: number       // scans WHERE channel = 'conference'
}

export interface IntentNudge {
  level: IntentLevel
  score: number
  progressPercent: number       // 0–100, for progress bar
  message: string
  cta: string | null
  ctaHref: string | null
}

// ── Weights ──────────────────────────────────────────────────────────────────
const W = {
  profileComplete:      20,
  emailProvided:        10,
  standScan:            10,   // per scan
  standScanMax:          3,   // cap at 3 scans = max 30 pts
  swipeRight:           15,   // per swipe
  swipeRightMax:         2,   // cap at 2 swipes = max 30 pts
  appointmentBooked:    25,
  conferenceAttended:   15,   // counted once regardless of count
}

// ── Thresholds ────────────────────────────────────────────────────────────────
// low: 0–30 · medium: 31–65 · high: 66+
export const INTENT_THRESHOLDS = { medium: 31, high: 66 }

// ── Compute score ─────────────────────────────────────────────────────────────
export function computeIntentScore(signals: IntentSignals): number {
  let score = 0
  if (signals.hasEducationLevel) score += W.profileComplete
  if (signals.hasRealEmail)      score += W.emailProvided
  score += Math.min(signals.standScanCount,  W.standScanMax)  * W.standScan
  score += Math.min(signals.swipeRightCount, W.swipeRightMax) * W.swipeRight
  if (signals.appointmentBooked)   score += W.appointmentBooked
  if (signals.conferenceCount > 0) score += W.conferenceAttended
  return score
}

export function computeIntentLevel(score: number): IntentLevel {
  if (score >= INTENT_THRESHOLDS.high)   return 'high'
  if (score >= INTENT_THRESHOLDS.medium) return 'medium'
  return 'low'
}

// ── Nudge text (student-facing, casual French) ────────────────────────────────
export function getIntentNudge(score: number, nextEventId?: string): IntentNudge {
  const level    = computeIntentLevel(score)
  const progress = Math.min(100, Math.round((score / 100) * 100))

  const config: Record<IntentLevel, Pick<IntentNudge, 'message' | 'cta' | 'ctaHref'>> = {
    low: {
      message:  'Tu viens d\'arriver ! Scanne un stand pour démarrer ton parcours 📍',
      cta:      'Voir le plan',
      ctaHref:  nextEventId ? `/fair/${nextEventId}` : null,
    },
    medium: {
      message:  'Bien parti(e) ! Réserve un RDV avec une école pour aller plus loin 📅',
      cta:      'Mes écoles',
      ctaHref:  '/schools',
    },
    high: {
      message:  'Excellent parcours ! Retrouve tout ton récap après le salon 🎯',
      cta:      'Mon récap',
      ctaHref:  nextEventId ? `/recap/${nextEventId}` : '/saved',
    },
  }

  return { level, score, progressPercent: progress, ...config[level] }
}
