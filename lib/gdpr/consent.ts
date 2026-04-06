import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import app from '../firebase/config'

const db = getFirestore(app)

export interface ConsentRecord {
  uid: string
  action: 'grant' | 'revoke'
  types: string[]  // ['optinLetudiant', 'optinCommercial', 'optinWAX']
  timestamp: string
  version: string
  userAgent?: string
  legalBasis: string
}

export async function writeConsent(record: ConsentRecord): Promise<void> {
  await addDoc(collection(db, 'consentAudit'), {
    ...record,
    timestamp: new Date().toISOString(),
  })
}

export async function revokeConsent(uid: string): Promise<void> {
  await writeConsent({
    uid,
    action: 'revoke',
    types: ['optinLetudiant', 'optinCommercial', 'optinWAX'],
    timestamp: new Date().toISOString(),
    version: '1.0',
    legalBasis: 'withdrawal',
  })
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, {
    'consent.optinLetudiant': false,
    'consent.optinCommercial': false,
    'consent.optinWAX': false,
  })
}

export async function cascadeDelete(uid: string): Promise<void> {
  const batch = writeBatch(db)
  // Anonymize scans
  const scansSnap = await getDocs(query(collection(db, 'scans'), where('userId', '==', uid)))
  scansSnap.docs.forEach(d => {
    batch.update(d.ref, { userId: `DELETED_${uid.substring(0, 8)}` })
  })
  // Delete user doc
  batch.delete(doc(db, 'users', uid))
  await batch.commit()
}

export function requiresParentalConsent(dob: string): boolean {
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age < 16
}

export function calculateAge(dob: string): number {
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}
