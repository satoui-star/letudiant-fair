'use client'
import { getSupabase } from '@/lib/supabase/client'

type EventType =
  | 'page_view'
  | 'swipe_right'
  | 'swipe_left'
  | 'stand_scan'
  | 'bookmark'
  | 'unbookmark'
  | 'search'
  | 'appointment_book'
  | 'comparison_add'
  | 'comparison_remove'
  | 'lead_export'
  | 'reel_play'
  | 'formation_view'
  | 'school_view'
  | 'onboarding_step'
  | 'wax_optin'

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'
  let id = sessionStorage.getItem('le_session_id')
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    sessionStorage.setItem('le_session_id', id)
  }
  return id
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

export async function track(event: EventType, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('analytics_events').insert({
      user_id: user?.id ?? null,
      session_id: getSessionId(),
      event_type: event,
      properties: properties ?? {},
      url_path: window.location.pathname,
      device_type: getDeviceType(),
    })
  } catch {
    // Analytics must never break the app
  }
}

export function trackPageView(page: string, extra?: Record<string, unknown>) {
  track('page_view', { page, ...extra })
}
