// Lead scoring - weights configurable via Firestore config doc

export type ScoreTier = 'exploring' | 'comparing' | 'deciding'

export interface DeclarativeSignals {
  fields: string[]
  domains: string[]
  educationLevel: string
}

export interface BehaviouralSignals {
  appointmentBooked: boolean  // pre-fair RDV — strongest collectible intent signal
  swipedRight: boolean
  visitedStand: boolean
  attendedConference: boolean
}

export interface ScoreWeights {
  declarative: number              // 0.5
  behavioural: number              // 0.5
  fieldInterestOverlap: number     // 0.4
  educationLevelMatch: number      // 0.3
  orientationStageProxy: number    // 0.3
  appointmentBooked: number        // 0.35 — deliberate pre-fair commitment
  swipedRight: number              // 0.25 — digital preference
  visitedStand: number             // 0.25 — physical presence
  attendedConference: number       // 0.15 — adjacent interest
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  declarative: 0.5,
  behavioural: 0.5,
  fieldInterestOverlap: 0.4,
  educationLevelMatch: 0.3,
  orientationStageProxy: 0.3,
  appointmentBooked: 0.35,
  swipedRight: 0.25,
  visitedStand: 0.25,
  attendedConference: 0.15,
}

function fieldInterestOverlap(studentFields: string[], schoolTargetFields: string[]): number {
  if (!studentFields.length || !schoolTargetFields.length) return 0
  const intersection = studentFields.filter(f => schoolTargetFields.includes(f))
  return intersection.length / Math.max(studentFields.length, schoolTargetFields.length)
}

function educationLevelMatch(studentLevel: string, schoolTargetLevels: string[]): number {
  return schoolTargetLevels.includes(studentLevel) ? 1 : 0
}

function orientationStageProxy(educationLevel: string): number {
  const stageMap: Record<string, number> = {
    'seconde': 0.3,
    'premiere': 0.5,
    'terminale': 0.8,
    'post-bac': 1.0,
  }
  return stageMap[educationLevel.toLowerCase()] ?? 0.3
}

export function computeLeadScore(
  student: { interests: { fields: string[]; domains: string[] }; profile: { educationLevel: string } },
  school: { matchingCriteria: { targetLevels: string[]; targetFields: string[] } },
  signals: BehaviouralSignals,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): { value: number; tier: ScoreTier } {
  const declarativeScore =
    weights.fieldInterestOverlap * fieldInterestOverlap(student.interests.fields, school.matchingCriteria.targetFields) +
    weights.educationLevelMatch * educationLevelMatch(student.profile.educationLevel, school.matchingCriteria.targetLevels) +
    weights.orientationStageProxy * orientationStageProxy(student.profile.educationLevel)

  const behaviouralScore =
    weights.appointmentBooked * (signals.appointmentBooked ? 1 : 0) +
    weights.swipedRight * (signals.swipedRight ? 1 : 0) +
    weights.visitedStand * (signals.visitedStand ? 1 : 0) +
    weights.attendedConference * (signals.attendedConference ? 1 : 0)

  const rawScore = weights.declarative * declarativeScore + weights.behavioural * behaviouralScore
  const value = Math.round(rawScore * 100)

  let tier: ScoreTier
  if (value <= 40) tier = 'exploring'
  else if (value <= 65) tier = 'comparing'
  else tier = 'deciding'

  return { value, tier }
}

export function getTierLabel(tier: ScoreTier): string {
  const labels: Record<ScoreTier, string> = {
    exploring: 'Exploration',
    comparing: 'Comparaison',
    deciding: 'Décision',
  }
  return labels[tier]
}
