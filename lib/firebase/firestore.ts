import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import app from './config'

const db = getFirestore(app)

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string
  profile: {
    name: string
    email: string
    dob: string
    educationLevel: string
    bacSeries?: string
    postalCode?: string
  }
  interests: {
    fields: string[]
    domains: string[]
    wishlist: string[]
  }
  consent: {
    optinLetudiant: boolean
    optinCommercial: boolean
    optinWAX: boolean
    consentDate: string
    legalBasis: string
    parentApproved?: boolean
  }
  identity: {
    clientId_BtoC?: string
    eventMakerIds: string[]
    isMinor: boolean
    guardianUid?: string
  }
  groupMembership?: {
    groupId: string
    teacherUid: string
    inviteAcceptedAt: string
  }
  orientationScore: {
    stage: 'exploring' | 'comparing' | 'deciding'
    scoreValue: number
    lastUpdated: string
  }
  role: 'student' | 'teacher' | 'exhibitor' | 'admin'
}

export interface FairEvent {
  eventId: string
  metadata: {
    name: string
    city: string
    date: string
    venueMap?: string
  }
  stands: Stand[]
  sessions: Session[]
}

export interface Stand {
  standId: string
  schoolId: string
  schoolName: string
  location: { x: number; y: number }
  category: string
}

export interface Session {
  sessionId: string
  title: string
  speakerSchoolId: string
  room: string
  startTime: string
  endTime: string
}

export interface ScanEvent {
  scanId?: string
  userId: string
  eventId: string
  standId?: string
  sessionId?: string
  channel: 'entry' | 'stand' | 'conference' | 'exit'
  timestamp: string
  dwellEstimate?: number
}

export interface Match {
  matchId?: string
  studentId: string
  schoolId: string
  studentSwipe: 'right' | 'left' | null
  schoolInterest: boolean
  appointmentBooked: boolean
  createdAt: string
}

export interface Lead {
  leadId?: string
  studentId: string
  schoolId: string
  eventId: string
  declarativeSignals: {
    educationLevel: string
    fields: string[]
    domains: string[]
  }
  behaviouralSignals: {
    standsVisited: string[]
    confsAttended: string[]
    dwellMinutes: number
    swipeResult: boolean
  }
  score: {
    value: number
    tier: 'exploring' | 'comparing' | 'deciding'
    computedAt: string
  }
  exported?: {
    by: string
    at: string
    method: string
  }
}

export interface School {
  schoolId?: string
  identity: {
    name: string
    type: string
    city: string
    website?: string
  }
  programmes: {
    name: string
    duration: string
    level: string
    fields: string[]
    admissionRequirements?: string
  }[]
  media: {
    coverImageUrl?: string
    reelUrl?: string
    galleryUrls?: string[]
  }
  matchingCriteria: {
    targetLevels: string[]
    targetFields: string[]
    targetRegions: string[]
  }
  fairPresence?: {
    eventId: string
    standId: string
    appointmentSlots: string[]
  }[]
}

export interface Group {
  groupId?: string
  teacherId: string
  schoolName: string
  fairId: string
  inviteLink: string
  inviteLinkExpiry: string
  memberUids: string[]
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

export async function getUser(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { uid: snap.id, ...snap.data() } as UserProfile
}

export async function setUser(uid: string, data: Partial<UserProfile>): Promise<void> {
  await setDoc(doc(db, 'users', uid), data, { merge: true })
}

export async function getEvents(): Promise<FairEvent[]> {
  const snap = await getDocs(collection(db, 'events'))
  return snap.docs.map(d => ({ eventId: d.id, ...d.data() }) as FairEvent)
}

export async function getEvent(eventId: string): Promise<FairEvent | null> {
  const snap = await getDoc(doc(db, 'events', eventId))
  if (!snap.exists()) return null
  return { eventId: snap.id, ...snap.data() } as FairEvent
}

export async function getSchools(): Promise<School[]> {
  const snap = await getDocs(collection(db, 'schools'))
  return snap.docs.map(d => ({ schoolId: d.id, ...d.data() }) as School)
}

export async function getSchool(schoolId: string): Promise<School | null> {
  const snap = await getDoc(doc(db, 'schools', schoolId))
  if (!snap.exists()) return null
  return { schoolId: snap.id, ...snap.data() } as School
}

export async function createScan(scan: ScanEvent): Promise<string> {
  const ref = await addDoc(collection(db, 'scans'), scan)
  return ref.id
}

export async function getUserScans(userId: string, eventId: string): Promise<ScanEvent[]> {
  const q = query(
    collection(db, 'scans'),
    where('userId', '==', userId),
    where('eventId', '==', eventId),
    orderBy('timestamp', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ scanId: d.id, ...d.data() }) as ScanEvent)
}

export async function getLeadsForSchool(schoolId: string): Promise<Lead[]> {
  const q = query(collection(db, 'leads'), where('schoolId', '==', schoolId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ leadId: d.id, ...d.data() }) as Lead)
}

export async function getLead(leadId: string): Promise<Lead | null> {
  const snap = await getDoc(doc(db, 'leads', leadId))
  if (!snap.exists()) return null
  return { leadId: snap.id, ...snap.data() } as Lead
}

export async function markLeadExported(leadId: string, by: string): Promise<void> {
  await setDoc(
    doc(db, 'leads', leadId),
    {
      exported: {
        by,
        at: new Date().toISOString(),
        method: 'portal_export',
      },
    },
    { merge: true }
  )
}

export async function setMatch(match: Match): Promise<void> {
  const matchId = match.matchId ?? `${match.studentId}_${match.schoolId}`
  const { matchId: _id, ...rest } = match
  await setDoc(doc(db, 'matches', matchId), rest, { merge: true })
}

export async function getMatchesForStudent(studentId: string): Promise<Match[]> {
  const q = query(collection(db, 'matches'), where('studentId', '==', studentId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ matchId: d.id, ...d.data() }) as Match)
}

export async function getGroup(token: string): Promise<Group | null> {
  const q = query(collection(db, 'groups'), where('inviteLink', '==', token))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { groupId: d.id, ...d.data() } as Group
}
