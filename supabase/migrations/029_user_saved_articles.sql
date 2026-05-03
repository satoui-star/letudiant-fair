-- Migration 024: Create user_saved_articles table for tracking saved actualités
-- Purpose: Enable students to save articles from Discover > Actualités and access them in Dossier > Liens Sauvegardés > Actualités

CREATE TABLE IF NOT EXISTS public.user_saved_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- Index for efficient queries by user
CREATE INDEX idx_user_saved_articles_user_id
  ON public.user_saved_articles(user_id);

-- Index for efficient sorting by saved date (most common query pattern)
CREATE INDEX idx_user_saved_articles_saved_at
  ON public.user_saved_articles(user_id, saved_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_saved_articles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own saved articles
CREATE POLICY "Users view own saved articles"
  ON public.user_saved_articles FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own saved articles
CREATE POLICY "Users insert own saved articles"
  ON public.user_saved_articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own saved articles
CREATE POLICY "Users delete own saved articles"
  ON public.user_saved_articles FOR DELETE
  USING (auth.uid() = user_id);
