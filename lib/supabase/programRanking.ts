import type { FormationRow, UserRow, SchoolRow } from '@/lib/supabase/types'
import { getSupabase } from '@/lib/supabase/client'

/**
 * Score a single formation based on how well its fields match the student's interests
 *
 * Scoring breakdown:
 * - Field overlap (100% weight): How many of the formation's fields match the student's education branches
 *
 * Note: We only use field overlap for formations because formations inherit school's level/region context
 */
function scoreFormationForStudent(formation: FormationRow, userProfile: UserRow): number {
  let score = 0

  // Field overlap (100% weight, max 100 points)
  // Each matching field = proportional points
  if (userProfile.education_branches && userProfile.education_branches.length > 0 && formation.fields && formation.fields.length > 0) {
    const overlap = formation.fields.filter((field) =>
      userProfile.education_branches.includes(field)
    ).length

    // Score = (matching fields / total formation fields) * 100
    // Encourages formations with more matching fields
    const fieldScore = (overlap / formation.fields.length) * 100
    score += fieldScore
  }

  return score
}

/**
 * Load formations that the student has previously swiped right on
 * Used to identify formation categories the student is interested in
 */
async function getStudentRightSwipedFormationFields(studentId: string): Promise<Set<string>> {
  const { data: matches } = await getSupabase()
    .from('matches')
    .select('formation_id')
    .eq('student_id', studentId)
    .eq('student_swipe', 'right')

  if (!matches || matches.length === 0) {
    return new Set()
  }

  // Get unique formation IDs
  const formationIds = [...new Set(matches.map((m) => m.formation_id))]

  // Fetch formations to get their fields
  const { data: formations } = await getSupabase()
    .from('formations')
    .select('fields')
    .in('id', formationIds)

  // Collect all fields from liked formations
  const likedFields = new Set<string>()
  if (formations) {
    for (const formation of formations) {
      if (formation.fields && Array.isArray(formation.fields)) {
        formation.fields.forEach((field) => likedFields.add(field))
      }
    }
  }

  return likedFields
}

/**
 * Apply a boost to formations that are similar to ones the student has already swiped right on
 * This teaches the algorithm: "show me more formations like the ones I liked"
 */
function applyBehavioralBoost(formation: FormationRow, likedFields: Set<string>): number {
  let boost = 0

  // Boost based on field overlap with previously liked formations
  if (formation.fields && formation.fields.length > 0) {
    const matchingFields = formation.fields.filter((field) => likedFields.has(field)).length

    // +25 points per matching field (max boost = 100 if all fields match)
    boost = matchingFields * 25
  }

  return boost
}

/**
 * Rank formations for a student based on profile match + behavioral signals
 *
 * @param studentId - The student's ID
 * @param userProfile - The student's profile (education_branches, education_level, postal_code, etc.)
 * @param allFormations - All available formations to rank (with school context attached)
 * @returns Formations sorted by relevance to the student (highest match first)
 */
export async function rankFormationsForStudent(
  studentId: string,
  userProfile: UserRow,
  allFormations: Array<FormationRow & { schoolId: string; schoolName: string; schoolCity: string; schoolType: string; schoolImage?: string }>
): Promise<Array<FormationRow & { schoolId: string; schoolName: string; schoolCity: string; schoolType: string; schoolImage?: string; score: number }>> {
  // Load formation fields the student has already swiped right on
  const likedFields = await getStudentRightSwipedFormationFields(studentId)

  // Score each formation
  const scoredFormations = allFormations.map((formation) => {
    // Profile match score (0-100)
    const profileScore = scoreFormationForStudent(formation, userProfile)

    // Behavioral boost from previous swipes (0-100)
    const behavioralBoost = applyBehavioralBoost(formation, likedFields)

    // Total score = 60% profile match + 40% behavioral boost
    // Cap behavioral boost at 100 to prevent over-weighting
    const totalScore = profileScore * 0.6 + Math.min(behavioralBoost, 100) * 0.4

    return {
      ...formation,
      score: totalScore,
    }
  })

  // Sort by score (highest first)
  scoredFormations.sort((a, b) => b.score - a.score)

  return scoredFormations
}
