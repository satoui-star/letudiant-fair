-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 012 — Create school_reels table for storing video reels
-- Videos uploaded by schools to Supabase Storage
-- ═══════════════════════════════════════════════════════════════════════════

-- Create table: school_reels
CREATE TABLE IF NOT EXISTS public.school_reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url VARCHAR(512) NOT NULL, -- Path to video in Supabase Storage (e.g., "reels/school-id/video.mp4")
  duration_seconds INTEGER, -- Duration in seconds (optional, can be auto-calculated)
  thumbnail_color VARCHAR(7) DEFAULT '#667eea', -- Hex color for thumbnail background
  tags TEXT[] DEFAULT '{}', -- Array of tags (e.g., ['Admission', 'Campus Tour'])
  view_count INTEGER DEFAULT 0, -- Total views
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_school_reels_school_id
  ON public.school_reels(school_id);

CREATE INDEX idx_school_reels_published_at
  ON public.school_reels(published_at DESC);

CREATE INDEX idx_school_reels_view_count
  ON public.school_reels(view_count DESC);

-- Enable RLS
ALTER TABLE public.school_reels ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view published reels
CREATE POLICY "Anyone view published reels"
  ON public.school_reels FOR SELECT
  USING (true);

-- Only school owners can insert reels for their school
CREATE POLICY "School owners insert reels"
  ON public.school_reels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = school_id
        AND schools.school_owner = auth.uid()
    )
  );

-- School owners can update their own reels
CREATE POLICY "School owners update reels"
  ON public.school_reels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = school_id
        AND schools.school_owner = auth.uid()
    )
  );

-- School owners can delete their own reels
CREATE POLICY "School owners delete reels"
  ON public.school_reels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = school_id
        AND schools.school_owner = auth.uid()
    )
  );

-- Admin can view all and manage all
CREATE POLICY "Admin view all reels"
  ON public.school_reels FOR SELECT
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

CREATE POLICY "Admin manage all reels"
  ON public.school_reels FOR UPDATE
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');

CREATE POLICY "Admin delete all reels"
  ON public.school_reels FOR DELETE
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');
