-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 011 — Create user_saved_formations table to track when formations
-- are saved with timestamp
-- ═══════════════════════════════════════════════════════════════════════════

-- Create table: user_saved_formations
CREATE TABLE IF NOT EXISTS public.user_saved_formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, formation_id)
);

-- Create index for faster queries
CREATE INDEX idx_user_saved_formations_user_id
  ON public.user_saved_formations(user_id);

CREATE INDEX idx_user_saved_formations_saved_at
  ON public.user_saved_formations(user_id, saved_at DESC);

-- Enable RLS
ALTER TABLE public.user_saved_formations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own saved formations
CREATE POLICY "Users view own saved formations"
  ON public.user_saved_formations FOR SELECT
  USING (user_id = auth.uid());

-- Users can only insert their own saved formations
CREATE POLICY "Users insert own saved formations"
  ON public.user_saved_formations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can only delete their own saved formations
CREATE POLICY "Users delete own saved formations"
  ON public.user_saved_formations FOR DELETE
  USING (user_id = auth.uid());

-- Admin can view all
CREATE POLICY "Admin views all saved formations"
  ON public.user_saved_formations FOR SELECT
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin');
