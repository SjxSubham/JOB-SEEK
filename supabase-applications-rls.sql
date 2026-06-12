-- =====================================================
-- JOBSEEK APPLICATIONS TABLE RLS POLICIES
-- Using requesting_user_id() function for authentication
-- =====================================================

-- 1. Ensure the requesting_user_id() function exists
-- =====================================================
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT
LANGUAGE SQL STABLE
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::text;
$$;

-- 2. Create applications table if not exists
-- =====================================================
CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id TEXT NOT NULL,
    name TEXT,
    email TEXT,
    phone TEXT,
    experience TEXT,
    education TEXT,
    skills TEXT,
    resume TEXT,
    status TEXT DEFAULT 'applied',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- 4. Enable RLS on applications table
-- =====================================================
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist
-- =====================================================
DROP POLICY IF EXISTS "Candidates can view their own applications" ON applications;
DROP POLICY IF EXISTS "Candidates can insert their own applications" ON applications;
DROP POLICY IF EXISTS "Candidates can update their own applications" ON applications;
DROP POLICY IF EXISTS "Candidates can delete their own applications" ON applications;
DROP POLICY IF EXISTS "Recruiters can view applications for their jobs" ON applications;
DROP POLICY IF EXISTS "Recruiters can update applications for their jobs" ON applications;

-- 6. Candidate Policies
-- =====================================================

-- Candidates can view their own applications
CREATE POLICY "Candidates can view their own applications"
    ON applications
    FOR SELECT
    USING (requesting_user_id() = candidate_id);

-- Candidates can insert their own applications
CREATE POLICY "Candidates can insert their own applications"
    ON applications
    FOR INSERT
    WITH CHECK (requesting_user_id() = candidate_id);

-- Candidates can update their own applications (e.g., withdraw)
CREATE POLICY "Candidates can update their own applications"
    ON applications
    FOR UPDATE
    USING (requesting_user_id() = candidate_id)
    WITH CHECK (requesting_user_id() = candidate_id);

-- Candidates can delete their own applications
CREATE POLICY "Candidates can delete their own applications"
    ON applications
    FOR DELETE
    USING (requesting_user_id() = candidate_id);

-- 7. Recruiter Policies
-- =====================================================

-- Recruiters can view applications for jobs they created
CREATE POLICY "Recruiters can view applications for their jobs"
    ON applications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = applications.job_id
            AND jobs.recruiter_id = requesting_user_id()
        )
    );

-- Recruiters can update application status for jobs they created
CREATE POLICY "Recruiters can update applications for their jobs"
    ON applications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = applications.job_id
            AND jobs.recruiter_id = requesting_user_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = applications.job_id
            AND jobs.recruiter_id = requesting_user_id()
        )
    );

-- 8. Grant permissions
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON applications TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE applications_id_seq TO authenticated;

-- 9. Create trigger for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_applications_updated_at_trigger ON applications;
CREATE TRIGGER update_applications_updated_at_trigger
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_applications_updated_at();

-- =====================================================
-- End of Applications RLS Setup
-- =====================================================

-- To verify the policies were created, run:
-- SELECT * FROM pg_policies WHERE tablename = 'applications';
