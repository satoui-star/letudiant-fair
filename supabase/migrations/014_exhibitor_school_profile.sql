/**
 * Migration 012: Exhibitor School Profile Fields
 *
 * Adds fields to exhibitor profiles for school recommendation algorithm
 * Includes:
 * - target_education_levels: array of education levels school recruits for
 * - programme_domains: array of domains/branches offered
 * - minimum_academic_requirement: numeric 0-20 scale for admission threshold
 * - bac_specialty_preference: array of preferred Bac specialties (optional)
 */

-- Add columns to schools/exhibitor_profiles table
-- Assuming table is called 'schools' in your schema
ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS target_education_levels TEXT[] DEFAULT '{Bac+1,Bac+2,Bac+3}'::TEXT[],
ADD COLUMN IF NOT EXISTS programme_domains TEXT[] DEFAULT '{Ingénierie}'::TEXT[],
ADD COLUMN IF NOT EXISTS minimum_academic_requirement NUMERIC DEFAULT 12 CHECK (minimum_academic_requirement >= 0 AND minimum_academic_requirement <= 20),
ADD COLUMN IF NOT EXISTS bac_specialty_preference TEXT[] DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.schools.target_education_levels IS 'Array of education levels this school recruits for (e.g., [Bac+1, Bac+2, Bac+3])';
COMMENT ON COLUMN public.schools.programme_domains IS 'Array of domains/branches offered (e.g., [Ingénierie, Informatique, Commerce])';
COMMENT ON COLUMN public.schools.minimum_academic_requirement IS 'Numeric 0-20 scale: minimum grade required for admission (e.g., 12 = Bon, 16 = Très Bon)';
COMMENT ON COLUMN public.schools.bac_specialty_preference IS 'Optional array of preferred Bac specialties (e.g., [Maths, Physique-Chimie])';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_schools_target_education_levels ON public.schools USING GIN (target_education_levels);
CREATE INDEX IF NOT EXISTS idx_schools_programme_domains ON public.schools USING GIN (programme_domains);
