import type { SchoolRow, UserRow } from '@/lib/supabase/types'
import { getSupabase } from '@/lib/supabase/client'

/**
 * Score a single school based on how well it matches the student's profile
 *
 * Scoring breakdown:
 * - Field overlap (60% weight): How many of the student's interests match the school's target fields
 * - Education level match (20% weight): Does the school accept the student's education level?
 * - Region match (20% weight): Does the school recruit from the student's region?
 */
function scoreSchoolForStudent(school: SchoolRow, userProfile: UserRow): number {
  let score = 0

  // 1. Field overlap (60% weight, max 60 points)
  if (userProfile.education_branches && userProfile.education_branches.length > 0 && school.target_fields && school.target_fields.length > 0) {
    const overlap = userProfile.education_branches.filter((branch) =>
      school.target_fields.includes(branch)
    ).length
    const fieldScore = (overlap / userProfile.education_branches.length) * 60
    score += fieldScore
  }

  // 2. Education level match (20% weight, 20 points if match)
  if (userProfile.education_level && school.target_levels && school.target_levels.includes(userProfile.education_level)) {
    score += 20
  }

  // 3. Region match (20% weight, 20 points if match)
  if (userProfile.postal_code && school.target_regions && school.target_regions.length > 0) {
    // Extract region from postal code (first 2 digits = French region code)
    const regionCode = userProfile.postal_code.substring(0, 2)
    const matchesRegion = school.target_regions.some(
      (region) => region.includes(regionCode) || region === 'International' || region === 'National'
    )
    if (matchesRegion) {
      score += 20
    }
  }

  return score
}

/**
 * Load schools that the student has previously swiped right on
 * Used to identify categories the student is interested in
 */
async function getStudentRightSwipedSchools(studentId: string): Promise<SchoolRow[]> {
  const { data: matches } = await getSupabase()
    .from('matches')
    .select('school_id')
    .eq('student_id', studentId)
    .eq('student_swipe', 'right')

  if (!matches || matches.length === 0) {
    return []
  }

  const schoolIds = matches.map((m) => m.school_id)

  const { data: schools } = await getSupabase()
    .from('schools')
    .select('*')
    .in('id', schoolIds)

  return schools ?? []
}

/**
 * Apply a boost to schools that are similar to ones the student has already swiped right on
 * This teaches the algorithm: "show me more schools like the ones I liked"
 */
function applyBehavioralBoost(school: SchoolRow, rightSwipedSchools: SchoolRow[]): number {
  let boost = 0

  // Find schools the student swiped right on
  for (const likedSchool of rightSwipedSchools) {
    // Boost if both schools are in the same fields
    const fieldOverlap = school.target_fields.filter((field) =>
      likedSchool.target_fields.includes(field)
    ).length

    if (fieldOverlap > 0) {
      boost += fieldOverlap * 10 // +10 points per matching field
    }

    // Bonus if same school type
    if (school.type === likedSchool.type) {
      boost += 5
    }
  }

  return boost
}

/**
 * Rank schools for a student based on profile match + behavioral signals
 *
 * @param studentId - The student's ID
 * @param userProfile - The student's profile (education_branches, education_level, postal_code, etc.)
 * @param allSchools - All available schools to rank
 * @returns Schools sorted by relevance to the student (highest match first)
 */
export async function rankSchoolsForStudent(
  studentId: string,
  userProfile: UserRow,
  allSchools: SchoolRow[]
): Promise<SchoolRow[]> {
  // Load schools the student has already swiped right on
  const rightSwipedSchools = await getStudentRightSwipedSchools(studentId)

  // Score each school
  const scoredSchools = allSchools.map((school) => {
    // Profile match score (0-100)
    const profileScore = scoreSchoolForStudent(school, userProfile)

    // Behavioral boost from previous swipes (0+)
    const behavioralBoost = applyBehavioralBoost(school, rightSwipedSchools)

    // Total score = 60% profile match + 40% behavioral boost
    const totalScore = profileScore * 0.6 + Math.min(behavioralBoost, 40) * 0.4

    return {
      school,
      score: totalScore,
    }
  })

  // Sort by score (highest first)
  scoredSchools.sort((a, b) => b.score - a.score)

  // Return just the schools, in ranked order
  return scoredSchools.map((item) => item.school)
}
