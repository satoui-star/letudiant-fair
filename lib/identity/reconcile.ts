// Identity reconciliation: EventMaker registration → BtoC Client_ID matching

export interface EventMakerRegistration {
  email: string
  phone?: string
  firstName: string
  lastName: string
  dob?: string
  fairId: string
}

// Levenshtein distance for fuzzy name matching
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

export function nameSimilarity(name1: string, name2: string): number {
  const a = name1.toLowerCase().trim()
  const b = name2.toLowerCase().trim()
  if (a === b) return 1
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a, b) / maxLen
}

export interface ReconciliationResult {
  matched: boolean
  confidence: number
  matchType: 'exact_email' | 'exact_phone' | 'fuzzy_name_dob' | 'none'
  existingUid?: string
}

export function computeReconciliationConfidence(
  registration: EventMakerRegistration,
  candidate: { email?: string; phone?: string; name?: string; dob?: string }
): ReconciliationResult {
  // Exact email match
  if (
    registration.email &&
    candidate.email &&
    registration.email.toLowerCase() === candidate.email.toLowerCase()
  ) {
    return { matched: true, confidence: 1.0, matchType: 'exact_email' }
  }
  // Exact phone match
  if (
    registration.phone &&
    candidate.phone &&
    registration.phone.replace(/\s/g, '') === candidate.phone.replace(/\s/g, '')
  ) {
    return { matched: true, confidence: 0.95, matchType: 'exact_phone' }
  }
  // Fuzzy name + DOB match
  if (registration.dob && candidate.dob && registration.dob === candidate.dob) {
    const fullName1 = `${registration.firstName} ${registration.lastName}`
    const fullName2 = candidate.name ?? ''
    const similarity = nameSimilarity(fullName1, fullName2)
    if (similarity >= 0.85) {
      return { matched: true, confidence: similarity * 0.9, matchType: 'fuzzy_name_dob' }
    }
  }
  return { matched: false, confidence: 0, matchType: 'none' }
}
