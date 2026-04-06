import * as admin from 'firebase-admin'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onRequest } from 'firebase-functions/v2/https'

admin.initializeApp()
const db = admin.firestore()

// ─── LEAD SCORING WEIGHTS (configurable in Firestore config doc) ───────────

interface ScoreWeights {
  declarative: number
  behavioural: number
  fieldInterestOverlap: number
  educationLevelMatch: number
  orientationStageProxy: number
  visitedStand: number
  attendedConference: number
  swipedRight: number
  dwellTime: number
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  declarative: 0.5,
  behavioural: 0.5,
  fieldInterestOverlap: 0.4,
  educationLevelMatch: 0.3,
  orientationStageProxy: 0.3,
  visitedStand: 0.25,
  attendedConference: 0.25,
  swipedRight: 0.30,
  dwellTime: 0.20,
}

async function getWeights(): Promise<ScoreWeights> {
  try {
    const configSnap = await db.doc('config/leadScoring').get()
    if (configSnap.exists) return { ...DEFAULT_WEIGHTS, ...configSnap.data() }
  } catch (_) { /* fall through to defaults */ }
  return DEFAULT_WEIGHTS
}

function fieldOverlap(studentFields: string[], schoolFields: string[]): number {
  if (!studentFields.length || !schoolFields.length) return 0
  const intersection = studentFields.filter(f => schoolFields.includes(f))
  return intersection.length / Math.max(studentFields.length, schoolFields.length)
}

function levelMatch(level: string, targetLevels: string[]): number {
  return targetLevels.map(l => l.toLowerCase()).includes(level.toLowerCase()) ? 1 : 0
}

function stageProxy(level: string): number {
  const map: Record<string, number> = {
    seconde: 0.3, première: 0.5, terminale: 0.8, 'post-bac': 1.0,
  }
  return map[level.toLowerCase()] ?? 0.3
}

// ─── FUNCTION 1: Recompute lead score on every new scan ───────────────────

export const onScanCreate = onDocumentCreated('scans/{scanId}', async (event) => {
  const scan = event.data?.data()
  if (!scan) return

  const { userId, eventId, standId, sessionId, channel } = scan
  if (!userId || !eventId) return

  // Skip entry/exit scans — they don't enrich lead scores
  if (channel === 'entry' || channel === 'exit') return

  const schoolId: string | undefined = standId
    ? (await db.doc(`events/${eventId}`).get())
        .data()
        ?.stands?.find((s: { standId: string; schoolId: string }) => s.standId === standId)?.schoolId
    : undefined

  if (!schoolId) return

  const [userSnap, schoolSnap, existingScansSnap, matchSnap, weightsObj] = await Promise.all([
    db.doc(`users/${userId}`).get(),
    db.doc(`schools/${schoolId}`).get(),
    db.collection('scans').where('userId', '==', userId).where('eventId', '==', eventId).get(),
    db.collection('matches')
      .where('studentId', '==', userId)
      .where('schoolId', '==', schoolId)
      .limit(1)
      .get(),
    getWeights(),
  ])

  if (!userSnap.exists || !schoolSnap.exists) return

  const user = userSnap.data()!
  const school = schoolSnap.data()!

  // Aggregate behavioral signals from all scans
  const scans = existingScansSnap.docs.map(d => d.data())
  const visitedStand = scans.some(s => s.standId && s.channel === 'stand')
  const attendedConference = scans.some(s => s.sessionId && s.channel === 'conference')
  const swipedRight = !matchSnap.empty && matchSnap.docs[0].data().studentSwipe === 'right'

  // Compute dwell time from entry → latest scan delta
  const timestamps = scans.map(s => new Date(s.timestamp).getTime()).sort((a, b) => a - b)
  const dwellMinutes = timestamps.length >= 2
    ? (timestamps[timestamps.length - 1] - timestamps[0]) / 60000
    : 0

  // Compute score
  const w = weightsObj
  const declarativeScore =
    w.fieldInterestOverlap * fieldOverlap(user.interests?.fields ?? [], school.matchingCriteria?.targetFields ?? []) +
    w.educationLevelMatch * levelMatch(user.profile?.educationLevel ?? '', school.matchingCriteria?.targetLevels ?? []) +
    w.orientationStageProxy * stageProxy(user.profile?.educationLevel ?? '')

  const behaviouralScore =
    w.visitedStand * (visitedStand ? 1 : 0) +
    w.attendedConference * (attendedConference ? 1 : 0) +
    w.swipedRight * (swipedRight ? 1 : 0) +
    w.dwellTime * Math.min(dwellMinutes / 30, 1)

  const rawScore = w.declarative * declarativeScore + w.behavioural * behaviouralScore
  const value = Math.round(rawScore * 100)
  const tier = value <= 40 ? 'exploring' : value <= 65 ? 'comparing' : 'deciding'

  // Upsert lead document
  const leadQuery = await db.collection('leads')
    .where('studentId', '==', userId)
    .where('schoolId', '==', schoolId)
    .where('eventId', '==', eventId)
    .limit(1)
    .get()

  const leadData = {
    studentId: userId,
    schoolId,
    eventId,
    declarativeSignals: {
      educationLevel: user.profile?.educationLevel ?? '',
      fields: user.interests?.fields ?? [],
      domains: user.interests?.domains ?? [],
    },
    behaviouralSignals: {
      standsVisited: scans.filter(s => s.channel === 'stand').map(s => s.standId),
      confsAttended: scans.filter(s => s.channel === 'conference').map(s => s.sessionId),
      dwellMinutes,
      swipeResult: swipedRight,
    },
    score: { value, tier, computedAt: new Date().toISOString() },
  }

  if (leadQuery.empty) {
    await db.collection('leads').add(leadData)
  } else {
    await leadQuery.docs[0].ref.update({
      behaviouralSignals: leadData.behaviouralSignals,
      score: leadData.score,
    })
  }

  // Update student orientation score
  await db.doc(`users/${userId}`).update({
    'orientationScore.scoreValue': value,
    'orientationScore.stage': tier,
    'orientationScore.lastUpdated': new Date().toISOString(),
  })
})

// ─── FUNCTION 2: Post-fair WAX trigger (72h after fair_exit scan) ─────────

export const waxDispatch = onDocumentCreated('scans/{scanId}', async (event) => {
  const scan = event.data?.data()
  if (!scan || scan.channel !== 'exit') return

  const { userId, eventId } = scan

  // Gather personalization data
  const [userSnap, eventSnap, scansSnap] = await Promise.all([
    db.doc(`users/${userId}`).get(),
    db.doc(`events/${eventId}`).get(),
    db.collection('scans').where('userId', '==', userId).where('eventId', '==', eventId).get(),
  ])

  if (!userSnap.exists || !eventSnap.exists) return
  if (!userSnap.data()?.consent?.optinWAX) return  // Respect opt-in

  const user = userSnap.data()!
  const fairEvent = eventSnap.data()!
  const visitedStandIds = scansSnap.docs
    .filter(d => d.data().channel === 'stand')
    .map(d => d.data().standId)

  const leadsSnap = await db.collection('leads')
    .where('studentId', '==', userId)
    .where('eventId', '==', eventId)
    .get()

  // Queue WAX message (writes to wax_queue collection, picked up by WAX connector)
  await db.collection('wax_queue').add({
    userId,
    eventId,
    type: 'post_fair_recap',
    scheduledFor: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    payload: {
      studentName: user.profile?.name ?? 'Étudiant',
      fairName: fairEvent.metadata?.name ?? 'Le salon',
      standsVisited: visitedStandIds.length,
      leadsGenerated: leadsSnap.size,
      topScore: Math.max(...leadsSnap.docs.map(d => d.data().score?.value ?? 0), 0),
      channel: user.consent?.optinWAX ? 'whatsapp' : 'email',
      email: user.profile?.email,
    },
    status: 'pending',
    createdAt: new Date().toISOString(),
  })
})

// ─── FUNCTION 3: Scheduled cleanup — archive old scans to BigQuery ────────

export const scheduledCleanup = onSchedule('every 24 hours', async () => {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 12)

  const oldScans = await db.collection('scans')
    .where('timestamp', '<', cutoff.toISOString())
    .limit(500)
    .get()

  if (oldScans.empty) return

  const batch = db.batch()
  oldScans.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()

  console.log(`Archived ${oldScans.size} old scan events`)
})

// ─── FUNCTION 4: Verify parent consent email link ─────────────────────────

export const confirmParentalConsent = onRequest(async (req, res) => {
  if (req.method !== 'GET') { res.status(405).send('Method Not Allowed'); return }

  const { token } = req.query
  if (!token || typeof token !== 'string') { res.status(400).send('Missing token'); return }

  const pendingSnap = await db.collection('pendingParentalConsent')
    .where('token', '==', token)
    .limit(1)
    .get()

  if (pendingSnap.empty) { res.status(404).send('Token not found or expired'); return }

  const pending = pendingSnap.docs[0].data()
  if (new Date(pending.expiresAt) < new Date()) {
    res.status(410).send('Token expired')
    return
  }

  // Activate the child's account
  await db.doc(`users/${pending.childUid}`).update({
    'identity.isMinor': true,
    'consent.parentApproved': true,
    'consent.consentDate': new Date().toISOString(),
    'consent.legalBasis': 'parental_consent',
    'consent.optinLetudiant': true,
    status: 'active',
  })

  await pendingSnap.docs[0].ref.update({ used: true, usedAt: new Date().toISOString() })

  res.redirect(303, `${process.env.APP_URL ?? 'https://letudiant-fair.vercel.app'}/register?step=complete`)
})
