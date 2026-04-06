import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore'
import app from '@/lib/firebase/config'

const db = getFirestore(app)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params
    const body = await request.json()
    const { exportedBy } = body

    const leadRef = doc(db, 'leads', leadId)
    const leadSnap = await getDoc(leadRef)

    if (!leadSnap.exists()) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const lead = leadSnap.data()

    // Fetch student data (only after export authorization)
    const userRef = doc(db, 'users', lead.studentId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Mark as exported
    await updateDoc(leadRef, {
      exported: {
        by: exportedBy,
        at: new Date().toISOString(),
        method: 'portal_export',
      },
    })

    const user = userSnap.data()
    return NextResponse.json({
      leadId,
      student: {
        name: user.profile?.name,
        email: user.profile?.email,
        phone: user.profile?.phone,
      },
      score: lead.score,
      signals: lead.behaviouralSignals,
    })
  } catch (error) {
    console.error('Lead export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
