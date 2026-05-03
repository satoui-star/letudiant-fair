-- ─── Articles Table ──────────────────────────────────────────────────────────
-- Stores article data from L'Étudiant and future exposant uploads
-- Used for personalized recommendations and trending content display

CREATE TABLE IF NOT EXISTS public.articles (
  id TEXT PRIMARY KEY,                          -- UUID or slug
  title TEXT NOT NULL,
  description TEXT,
  rubrique VARCHAR(100),                        -- Category (e.g., "Admission", "Formation")
  reading_time_minutes INT,
  published_at TIMESTAMP WITH TIME ZONE,
  external_url TEXT,                            -- L'Étudiant URL or exposant link
  external_source VARCHAR(50),                  -- 'letudiant' | 'exposant'
  icon TEXT,                                    -- emoji or icon name
  gradient_class TEXT,                          -- 'gradient-1' through 'gradient-10'
  size VARCHAR(20) DEFAULT 'normal',            -- 'normal', 'large', 'tall', 'wide'
  category VARCHAR(50),                         -- For filtering: "Admission", "Formation", etc.
  is_featured BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,          -- Expiration date for temporary content
  view_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_articles_published_at
  ON public.articles(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_expires_at
  ON public.articles(expires_at);

CREATE INDEX IF NOT EXISTS idx_articles_category
  ON public.articles(category);

-- Articles are public content - no RLS needed (visible to all students)
