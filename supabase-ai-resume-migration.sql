-- =====================================================
-- JOBSEEK - AI RESUME FEATURE MIGRATION
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to add
-- the necessary columns and policies for the AI
-- Job Recommendations feature.
-- =====================================================

-- =====================================================
-- PART 1: ADD COLUMNS TO PROFILES TABLE
-- =====================================================

-- Add AI resume data columns if they don't exist
DO $$
BEGIN
    -- Add ai_resume_data column (JSONB to store parsed resume)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'ai_resume_data'
    ) THEN
        ALTER TABLE profiles ADD COLUMN ai_resume_data JSONB;
        COMMENT ON COLUMN profiles.ai_resume_data IS 'Parsed resume data from AI extraction (name, skills, experience, education, etc.)';
    END IF;

    -- Add ai_resume_parsed_at column (timestamp of last parse)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'ai_resume_parsed_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN ai_resume_parsed_at TIMESTAMP WITH TIME ZONE;
        COMMENT ON COLUMN profiles.ai_resume_parsed_at IS 'Timestamp when resume was last parsed by AI';
    END IF;

    -- Add ai_resume_url column (URL to the uploaded resume file)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'ai_resume_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN ai_resume_url TEXT;
        COMMENT ON COLUMN profiles.ai_resume_url IS 'URL to the uploaded resume file in storage';
    END IF;

    -- Ensure skills column exists as TEXT array
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'skills'
    ) THEN
        ALTER TABLE profiles ADD COLUMN skills TEXT[];
        COMMENT ON COLUMN profiles.skills IS 'Array of user skills (merged from resume and manual entry)';
    END IF;

    -- Ensure location column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'location'
    ) THEN
        ALTER TABLE profiles ADD COLUMN location TEXT;
        COMMENT ON COLUMN profiles.location IS 'User location for job matching';
    END IF;

    RAISE NOTICE 'Profile columns added/verified successfully';
END $$;

-- =====================================================
-- PART 2: CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================

-- Index for skills array (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON profiles USING GIN (skills);

-- Index for ai_resume_parsed_at for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_profiles_ai_resume_parsed_at ON profiles (ai_resume_parsed_at);

-- =====================================================
-- PART 3: CREATE JOB_RECOMMENDATIONS TABLE (OPTIONAL)
-- =====================================================
-- This table can be used to cache AI recommendations
-- Uncomment if you want persistent recommendations

/*
CREATE TABLE IF NOT EXISTS job_recommendations (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    match_score DECIMAL(5,2) NOT NULL,
    match_reasons TEXT[],
    matching_skills TEXT[],
    model_version TEXT DEFAULT 'ai-resume-v2',
    source TEXT DEFAULT 'resume_ai',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    UNIQUE(user_id, job_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_recommendations_user_id ON job_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_job_recommendations_job_id ON job_recommendations(job_id);
CREATE INDEX IF NOT EXISTS idx_job_recommendations_score ON job_recommendations(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_job_recommendations_expires ON job_recommendations(expires_at);

-- RLS Policies
ALTER TABLE job_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own recommendations" ON job_recommendations;
CREATE POLICY "Users can view their own recommendations"
    ON job_recommendations
    FOR SELECT
    USING (requesting_user_id() = user_id);

DROP POLICY IF EXISTS "Users can manage their own recommendations" ON job_recommendations;
CREATE POLICY "Users can manage their own recommendations"
    ON job_recommendations
    FOR ALL
    USING (requesting_user_id() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON job_recommendations TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE job_recommendations_id_seq TO authenticated;
*/

-- =====================================================
-- PART 4: CREATE RESUME_VALIDATIONS TABLE (OPTIONAL)
-- =====================================================
-- This table can be used to track resume validation history
-- Useful for debugging and analytics

/*
CREATE TABLE IF NOT EXISTS resume_validations (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    file_name TEXT,
    file_type TEXT,
    file_size INTEGER,
    extraction_method TEXT,
    is_valid BOOLEAN,
    errors JSONB,
    warnings JSONB,
    parsed_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_resume_validations_user_id ON resume_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_validations_created_at ON resume_validations(created_at DESC);

-- RLS
ALTER TABLE resume_validations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own validations" ON resume_validations;
CREATE POLICY "Users can view their own validations"
    ON resume_validations
    FOR SELECT
    USING (requesting_user_id() = user_id);

DROP POLICY IF EXISTS "Users can insert their own validations" ON resume_validations;
CREATE POLICY "Users can insert their own validations"
    ON resume_validations
    FOR INSERT
    WITH CHECK (requesting_user_id() = user_id);

GRANT SELECT, INSERT ON resume_validations TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE resume_validations_id_seq TO authenticated;
*/

-- =====================================================
-- PART 5: STORAGE BUCKET SETUP
-- =====================================================
-- Make sure the 'resumes' bucket exists and has proper policies
-- Run these in the Supabase Dashboard > Storage section if needed

-- Note: Storage bucket creation must be done via Dashboard or API
-- The following is for reference:
/*
-- Create bucket (do this in Dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (do this in Dashboard > Storage > Policies)
-- Policy: Allow authenticated users to upload their own resumes
-- Policy: Allow public read access to resumes
*/

-- =====================================================
-- PART 6: VERIFY SETUP
-- =====================================================

-- Check if columns were added
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('ai_resume_data', 'ai_resume_parsed_at', 'ai_resume_url', 'skills', 'location')
ORDER BY column_name;

-- =====================================================
-- DONE!
-- =====================================================
-- After running this migration:
-- 1. Verify the columns exist by checking the SELECT output above
-- 2. Ensure the 'resumes' storage bucket exists in Supabase Dashboard
-- 3. Set up storage policies if not already done
-- 4. Test the AI recommendations feature in your app
-- =====================================================
