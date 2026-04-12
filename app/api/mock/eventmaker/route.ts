import { NextResponse } from 'next/server'

// Mock EventMaker webhook — sends a simulated pre-registration to our own webhook.
// Usage: POST /api/mock/eventmaker
// Body: { email?, first_name?, last_name?, event_id? }

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Mock endpoint disabled in production' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))

  const mockPayload = {
    registration_id:   `em-mock-${Date.now()}`,
    email:             body.email        ?? 'test.etudiant@lycee-victor-hugo.fr',
    first_name:        body.first_name   ?? 'Sophie',
    last_name:         body.last_name    ?? 'Laurent',
    education_level:   body.education_level ?? 'Terminale Générale',
    bac_series:        body.bac_series   ?? 'Générale',
    postal_code:       body.postal_code  ?? '75011',
    declared_domains:  body.declared_domains ?? ['Informatique et Numérique', 'Sciences et Technologies'],
    event_id:          body.event_id     ?? 'a1b2c3d4-0000-0000-0000-000000000001',
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/webhooks/eventmaker`, {
    method:  'POST',
    headers: {
      'Content-Type':       'application/json',
      'x-webhook-secret':   process.env.EVENTMAKER_WEBHOOK_SECRET ?? 'dev-secret',
    },
    body: JSON.stringify(mockPayload),
  })

  const result = await res.json()
  return NextResponse.json({ mock_payload: mockPayload, webhook_response: result, status: res.status })
}
