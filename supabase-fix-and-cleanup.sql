-- =====================================================
-- JOBSEEK - FIX TRIGGER AND CLEANUP UNUSED TABLES
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: FIX THE APPLICATION STATUS TRIGGER
-- This fixes the 'invalid input value for enum status: "none"' error
-- =====================================================

-- Drop the problematic trigger first
DROP TRIGGER IF EXISTS trigger_application_status_change ON applications;

-- Drop the old function
DROP FUNCTION IF EXISTS track_application_status_change();

-- Recreate the function with proper text casting to avoid enum issues
CREATE OR REPLACE FUNCTION track_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job_title TEXT;
    v_company_name TEXT;
    v_recruiter_id TEXT;
    v_old_status TEXT;
    v_new_status TEXT;
BEGIN
    -- Only proceed if status changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Cast enum to text to avoid enum validation issues
        v_old_status := COALESCE(OLD.status::TEXT, 'unknown');
        v_new_status := NEW.status::TEXT;

        -- Get job details
        SELECT j.title, c.name, j.recruiter_id
        INTO v_job_title, v_company_name, v_recruiter_id
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        WHERE j.id = NEW.job_id;

        -- Update status_updated_at if column exists
        BEGIN
            NEW.status_updated_at = NOW();
        EXCEPTION WHEN undefined_column THEN
            -- Column doesn't exist, skip
            NULL;
        END;

        -- Log activity (only if application_activities table exists)
        BEGIN
            PERFORM log_application_activity(
                NEW.id,
                'status_change',
                COALESCE(requesting_user_id(), 'system'),
                CASE WHEN requesting_user_id() = NEW.candidate_id THEN 'candidate' ELSE 'recruiter' END,
                v_old_status,  -- Using text variable instead of enum
                v_new_status,  -- Using text variable instead of enum
                'Application status changed from ' || v_old_status || ' to ' || v_new_status
            );
        EXCEPTION WHEN undefined_function THEN
            -- Function doesn't exist, skip
            NULL;
        WHEN undefined_table THEN
            -- Table doesn't exist, skip
            NULL;
        END;

        -- Create notification for candidate (only if notifications table exists)
        BEGIN
            PERFORM create_notification(
                NEW.candidate_id,
                'application_status',
                'Application Update',
                'Your application for ' || COALESCE(v_job_title, 'a job') || ' at ' || COALESCE(v_company_name, 'Unknown Company') || ' is now ' || v_new_status,
                NEW.job_id,
                NEW.id,
                NULL,
                '/my-jobs'
            );
        EXCEPTION WHEN undefined_function THEN
            -- Function doesn't exist, skip
            NULL;
        WHEN undefined_table THEN
            -- Table doesn't exist, skip
            NULL;
        END;
    END IF;

    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_application_status_change
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION track_application_status_change();

-- =====================================================
-- PART 2: CLEANUP UNUSED TABLES (OPTIONAL)
-- Uncomment the sections below if you want to remove
-- the messaging and interview features
-- =====================================================

-- =====================================================
-- 2A: DROP MESSAGING TABLES
-- =====================================================
/*
-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;

-- Drop functions
DROP FUNCTION IF EXISTS update_conversation_last_message();
DROP FUNCTION IF EXISTS notify_new_message();

-- Drop tables (messages first due to foreign key)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
*/

-- =====================================================
-- 2B: DROP INTERVIEW TABLES
-- =====================================================
/*
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS recruiter_availability CASCADE;
*/

-- =====================================================
-- 2C: DROP APPLICATION TRACKING TABLES
-- (Keep these if you want activity history)
-- =====================================================
/*
DROP TABLE IF EXISTS application_activities CASCADE;
DROP TABLE IF EXISTS application_notes CASCADE;
DROP TABLE IF EXISTS application_ratings CASCADE;
*/

-- =====================================================
-- 2D: DROP NOTIFICATION TABLES
-- =====================================================
/*
-- Drop trigger first
DROP TRIGGER IF EXISTS trigger_new_application ON applications;
DROP FUNCTION IF EXISTS notify_new_application();
DROP FUNCTION IF EXISTS create_notification();

DROP TABLE IF EXISTS notifications CASCADE;
*/

-- =====================================================
-- 2E: DROP OTHER TABLES
-- =====================================================
/*
DROP TABLE IF EXISTS profile_views CASCADE;
DROP TABLE IF EXISTS job_recommendations CASCADE;
*/

-- =====================================================
-- PART 3: QUICK CLEANUP - REMOVE ALL ADVANCED FEATURES
-- Uncomment this entire section to remove ALL advanced
-- feature tables at once
-- =====================================================
/*
-- Drop all triggers
DROP TRIGGER IF EXISTS trigger_application_status_change ON applications;
DROP TRIGGER IF EXISTS trigger_new_application ON applications;
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;

-- Drop all functions
DROP FUNCTION IF EXISTS track_application_status_change();
DROP FUNCTION IF EXISTS notify_new_application();
DROP FUNCTION IF EXISTS update_conversation_last_message();
DROP FUNCTION IF EXISTS notify_new_message();
DROP FUNCTION IF EXISTS create_notification(TEXT, TEXT, TEXT, TEXT, BIGINT, BIGINT, UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS log_application_activity(BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);

-- Drop all advanced feature tables
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS recruiter_availability CASCADE;
DROP TABLE IF EXISTS application_activities CASCADE;
DROP TABLE IF EXISTS application_notes CASCADE;
DROP TABLE IF EXISTS application_ratings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS profile_views CASCADE;
DROP TABLE IF EXISTS job_recommendations CASCADE;
*/

-- =====================================================
-- PART 4: VERIFY THE FIX
-- Run this to test the status update works
-- =====================================================

-- Test query (update an application status)
-- UPDATE applications SET status = 'interviewing' WHERE id = 14;

-- Check if trigger exists
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname = 'trigger_application_status_change';

-- =====================================================
-- DONE!
-- =====================================================
-- After running Part 1, the application status update
-- should work without the 'none' enum error.
--
-- If you want to remove unused tables, uncomment the
-- relevant sections in Part 2 or Part 3 and run again.
-- =====================================================
