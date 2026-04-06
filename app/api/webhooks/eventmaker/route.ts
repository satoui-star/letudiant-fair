import { NextRequest, NextResponse } from 'next/server'
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
} from 'firebase/firestore'
import app from '@/lib/firebase/config'
import { computeReconciliationConfidence, type EventMakerRegistration } from '@/lib/identity/reconcile'

const db = getFirestore(app)

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EventMakerRegistration

    // Search for existing user by email
    const usersRef = collection(db, 'users')
    const emailQuery = query(usersRef, where('profile.email', '==', body.email.toLowerCase()))
    const emailSnap = await getDocs(emailQuery)

    if (!emailSnap.empty) {
      // Exact email match — link EventMaker ID
      const existingUser = emailSnap.docs[0]
      const currentIds: string[] = existingUser.data().identity?.eventMakerIds ?? []
      if (!currentIds.includes(body.fairId)) {
        await updateDoc(doc(db, 'users', existingUser.id), {
          'identity.eventMakerIds': [...currentIds, body.fairId],
        })
      }
      return NextResponse.json({ matched: true, uid: existingUser.id, confidence: 1.0 })
    }

    // Fuzzy match — check name + dob
    let bestMatch = { confidence: 0, uid: '' }
    const allUsersSnap = await getDocs(usersRef)

    for (const userDoc of allUsersSnap.docs) {
      const user = userDoc.data()
      const result = computeReconciliationConfidence(body, {
        email: user.profile?.email,
        phone: user.profile?.phone,
        name: user.profile?.name,
        dob: user.profile?.dob,
      })
      if (result.confidence > bestMatch.confidence) {
        bestMatch = { confidence: result.confidence, uid: userDoc.id }
      }
    }

    if (bestMatch.confidence >= 0.85) {
      // Good fuzzy match
      await updateDoc(doc(db, 'users', bestMatch.uid), {
        'identity.eventMakerIds': [body.fairId],
        'identity.reconciliationConfidence': bestMatch.confidence,
        'identity.pendingReview': bestMatch.confidence < 0.95,
      })
      return NextResponse.json({ matched: true, uid: bestMatch.uid, confidence: bestMatch.confidence })
    }

    // No match — create provisional profile
    const newUser = await addDoc(collection(db, 'users'), {
      profile: {
        name: `${body.firstName} ${body.lastName}`,
        email: body.email.toLowerCase(),
      },
      identity: {
        eventMakerIds: [body.fairId],
        isMinor: false,
        reconciliationConfidence: 0,
        provisional: true,
      },
      orientationScore: {
        stage: 'exploring',
        scoreValue: 0,
        lastUpdated: new Date().toISOString(),
      },
      role: 'student',
    })

    return NextResponse.json({ matched: false, uid: newUser.id, provisional: true })
  } catch (error) {
    console.error('EventMaker webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
