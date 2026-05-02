-- ─── Article Analytics Table ──────────────────────────────────────────────────────────
-- Tracks engagement metrics for articles in the Actualités section
-- Used for personalized recommendations, trending content, and analytics

CREATE TABLE IF NOT EXISTS public.article_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL, -- References article ID (from L'Étudiant or user-uploaded)
  action VARCHAR(50) NOT NULL CHECK (action IN ('viewed', 'clicked', 'shared', 'time_spent')), -- Type of interaction
  time_spent_seconds INTEGER, -- How long student spent viewing the article (in seconds)
  clicked_external_link BOOLEAN DEFAULT false, -- Did they click "Lire l'article complet"?
  shared_to TEXT, -- If shared, where? (whatsapp, email, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for faster analytics queries
CREATE INDEX idx_article_analytics_student_id
  ON public.article_analytics(student_id);

CREATE INDEX idx_article_analytics_article_id
  ON public.article_analytics(article_id);

CREATE INDEX idx_article_analytics_created_at
  ON public.article_analytics(created_at DESC);

CREATE INDEX idx_article_analytics_student_article
  ON public.article_analytics(student_id, article_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.article_analytics ENABLE ROW LEVEL SECURITY;

-- Students can only see their own analytics
CREATE POLICY "Users view own article analytics"
  ON public.article_analytics FOR SELECT
  USING (auth.uid() = student_id);

-- Students can only insert their own analytics
CREATE POLICY "Users insert own article analytics"
  ON public.article_analytics FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can only update their own analytics
CREATE POLICY "Users update own article analytics"
  ON public.article_analytics FOR UPDATE
  USING (auth.uid() = student_id);

-- Teachers/admins can view all analytics (optional, uncomment if needed)
-- CREATE POLICY "Admins view all article analytics"
--   ON public.article_analytics FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE user_id = auth.uid() AND role = 'admin'
--     )
--   );


-- ─── Utility Views ────────────────────────────────────────────────────────────────────

-- View: Most popular articles (by clicks + views)
CREATE OR REPLACE VIEW public.article_engagement_stats AS
SELECT
  article_id,
  COUNT(*) as total_interactions,
  SUM(CASE WHEN action = 'viewed' THEN 1 ELSE 0 END) as view_count,
  SUM(CASE WHEN action = 'clicked' AND clicked_external_link THEN 1 ELSE 0 END) as click_count,
  SUM(CASE WHEN action = 'shared' THEN 1 ELSE 0 END) as share_count,
  AVG(time_spent_seconds) as avg_time_spent,
  COUNT(DISTINCT student_id) as unique_students,
  MAX(created_at) as last_interaction_at
FROM public.article_analytics
GROUP BY article_id
ORDER BY total_interactions DESC;

-- View: Student article preferences (for recommendations)
CREATE OR REPLACE VIEW public.student_article_preferences AS
SELECT
  aa.student_id,
  aa.article_id,
  COUNT(*) as interaction_count,
  SUM(CASE WHEN aa.action = 'viewed' THEN 1 ELSE 0 END) as views,
  SUM(CASE WHEN aa.action = 'clicked' AND aa.clicked_external_link THEN 1 ELSE 0 END) as clicks,
  AVG(CASE WHEN aa.time_spent_seconds > 0 THEN aa.time_spent_seconds ELSE NULL END) as avg_time_on_article,
  MAX(aa.created_at) as last_interaction_at
FROM public.article_analytics aa
GROUP BY aa.student_id, aa.article_id;
