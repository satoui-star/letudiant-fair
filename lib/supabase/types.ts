export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Row types (defined flat, no circular refs) ───────────────────────────────

export type UserRow = {
  id: string
  email: string
  name: string
  role: 'student' | 'teacher' | 'exhibitor' | 'admin' | 'parent'
  dob: string | null
  education_level: string | null
  bac_series: string | null
  postal_code: string | null
  education_branches: string[]
  study_wishes: string[]
  wishlist: string[]
  optin_letudiant: boolean
  optin_commercial: boolean
  optin_wax: boolean
  consent_date: string | null
  parent_approved: boolean
  is_minor: boolean
  guardian_id: string | null
  group_id: string | null
  orientation_score: number
  orientation_stage: 'exploring' | 'comparing' | 'deciding'
  // intent level — computed from behavioral signals (migration 004)
  intent_score: number
  intent_level: 'low' | 'medium' | 'high'
  client_id_btoc: string | null
  eventmaker_ids: string[]
  created_at: string
  updated_at: string
}

export type PreRegistrationRow = {
  id: string
  email: string
  first_name: string
  last_name: string
  education_level: string | null
  bac_series: string | null
  postal_code: string | null
  declared_domains: string[]
  event_id: string
  eventmaker_registration_id: string | null
  registered_at: string
  resolved_user_id: string | null
  resolved_at: string | null
  created_at: string
}

export type EventRow = {
  id: string
  name: string
  city: string
  event_date: string
  venue_map: string | null
  address: string | null
  description: string | null
  is_virtual: boolean
  created_at: string
}

export type SchoolRow = {
  id: string
  name: string
  type: string
  city: string
  website: string | null
  cover_image_url: string | null
  reel_url: string | null
  description: string | null
  target_levels: string[]
  target_fields: string[]
  target_regions: string[]
  nb_accepted_bac_g: number | null
  nb_accepted_bac_t: number | null
  nb_accepted_bac_p: number | null
  rate_professional_insertion: number | null
  tuition_fee: number | null
  apprenticeship: boolean
  parcoursup: boolean
  scholarship_allowed: boolean
  created_at: string
}

export type FormationRow = {
  id: string
  school_id: string
  name: string
  duration: string
  level: string
  fields: string[]
  admission_requirements: string | null
  rncp_code: string | null
  study_modality: string | null
  cost: number | null
  created_at: string
}

export type StandRow = {
  id: string
  event_id: string
  school_id: string
  location_x: number
  location_y: number
  category: string
  created_at: string
}

export type SessionRow = {
  id: string
  event_id: string
  title: string
  speaker_school_id: string | null
  room: string
  start_time: string
  end_time: string
  description: string | null
  created_at: string
}

export type ScanRow = {
  id: string
  user_id: string
  event_id: string
  stand_id: string | null
  session_id: string | null
  channel: 'entry' | 'stand' | 'conference'
  created_at: string
}

export type AppointmentRow = {
  id: string
  student_id: string
  school_id: string
  event_id: string
  slot_time: string        // ISO timestamp of the chosen slot
  slot_duration: number   // minutes, default 15
  status: 'pending' | 'confirmed' | 'attended' | 'cancelled'
  student_notes: string | null
  created_at: string
}

export type LeadRow = {
  id: string
  student_id: string
  school_id: string
  event_id: string
  education_level: string
  education_branches: string[]
  study_wishes: string[]
  stands_visited: string[]
  confs_attended: string[]
  appointment_booked: boolean  // pre-fair appointment = strongest intent signal
  swipe_result: boolean
  score_value: number
  score_tier: 'exploring' | 'comparing' | 'deciding'
  score_computed_at: string
  exported_by: string | null
  exported_at: string | null
  created_at: string
}

export type MatchRow = {
  id: string
  student_id: string
  school_id: string
  student_swipe: 'right' | 'left' | null
  school_interest: boolean
  appointment_booked: boolean
  created_at: string
}

export type GroupRow = {
  id: string
  teacher_id: string
  school_name: string
  fair_id: string
  invite_link: string
  invite_link_expiry: string
  member_uids: string[]
  created_at: string
}

// ─── Database type (references flat row types, no circular refs) ──────────────

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow
        Insert: Partial<UserRow> & { id: string; email: string }
        Update: Partial<UserRow>
      }
      events: {
        Row: EventRow
        Insert: Partial<EventRow> & { name: string; city: string; event_date: string }
        Update: Partial<EventRow>
      }
      schools: {
        Row: SchoolRow
        Insert: Partial<SchoolRow> & { name: string; type: string; city: string }
        Update: Partial<SchoolRow>
      }
      formations: {
        Row: FormationRow
        Insert: Partial<FormationRow> & { school_id: string; name: string; duration: string; level: string }
        Update: Partial<FormationRow>
      }
      stands: {
        Row: StandRow
        Insert: Partial<StandRow> & { event_id: string; school_id: string; category: string }
        Update: Partial<StandRow>
      }
      sessions: {
        Row: SessionRow
        Insert: Partial<SessionRow> & { event_id: string; title: string; room: string; start_time: string; end_time: string }
        Update: Partial<SessionRow>
      }
      scans: {
        Row: ScanRow
        Insert: Partial<ScanRow> & { user_id: string; event_id: string; channel: ScanRow['channel'] }
        Update: Partial<ScanRow>
      }
      leads: {
        Row: LeadRow
        Insert: Partial<LeadRow> & { student_id: string; school_id: string; event_id: string; education_level: string }
        Update: Partial<LeadRow>
      }
      matches: {
        Row: MatchRow
        Insert: Partial<MatchRow> & { student_id: string; school_id: string }
        Update: Partial<MatchRow>
      }
      appointments: {
        Row: AppointmentRow
        Insert: Partial<AppointmentRow> & { student_id: string; school_id: string; event_id: string; slot_time: string }
        Update: Partial<AppointmentRow>
      }
      groups: {
        Row: GroupRow
        Insert: Partial<GroupRow> & { teacher_id: string; school_name: string; fair_id: string; invite_link: string; invite_link_expiry: string }
        Update: Partial<GroupRow>
      }
      pre_registrations: {
        Row: PreRegistrationRow
        Insert: Partial<PreRegistrationRow> & { email: string; first_name: string; last_name: string; event_id: string }
        Update: Partial<PreRegistrationRow>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
