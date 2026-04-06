import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, collection, addDoc } from 'firebase/firestore'
import app from '@/lib/firebase/config'

const db = getFirestore(app)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, eventId, standId, sessionId, channel } = body

    if (!userId || !eventId || !channel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const scan = {
      userId,
      eventId,
      standId: standId ?? null,
      sessionId: sessionId ?? null,
      channel,
      timestamp: new Date().toISOString(),
      dwellEstimate: null,
    }

    const ref = await addDoc(collection(db, 'scans'), scan)
    return NextResponse.json({ scanId: ref.id, success: true })
  } catch (error) {
    console.error('Scan POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
