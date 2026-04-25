-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 013 — Create user_saved_reels table for tracking saved reels
-- Users can save school reels they're interested in for later viewing
-- ═══════════════════════════════════════════════════════════════════════════

-- Create table: user_saved_reels
CREATE TABLE IF NOT EXISTS public.user_saved_reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reel_id UUID NOT NULL REFERENCES public.school_reels(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, reel_id)  -- Each user can save each reel only once
);

-- Create indexes for faster queries
CREATE INDEX idx_user_saved_reels_user_id
  ON public.user_saved_reels(user_id);

CREATE INDEX idx_user_saved_reels_saved_at
  ON public.user_saved_reels(user_id, saved_at DESC);

-- Enable RLS
ALTER TABLE public.user_saved_reels ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own saved reels
CREATE POLICY "Users view own saved reels"
  ON public.user_saved_reels FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own saved reels
CREATE POLICY "Users insert own saved reels"
  ON public.user_saved_reels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own saved reels
CREATE POLICY "Users delete own saved reels"
  ON public.user_saved_reels FOR DELETE
  USING (auth.uid() = user_id);
