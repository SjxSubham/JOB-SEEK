-- =====================================================
-- JOBSEEK - ROLLBACK RECENT CHANGES
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to undo
-- the database changes for Interview and Notifications.
-- =====================================================

-- 1. Remove columns from applications table
-- =====================================================
ALTER TABLE applications 
DROP COLUMN IF EXISTS interview_scheduled_at,
DROP COLUMN IF EXISTS interview_status,
DROP COLUMN IF EXISTS interview_meeting_link;

-- 2. Drop notifications table and related functions
-- =====================================================
DROP TABLE IF EXISTS notifications CASCADE;

-- Drop with specific argument list to avoid ambiguity
DROP FUNCTION IF EXISTS create_notification(TEXT, TEXT, TEXT, TEXT, BIGINT, BIGINT, TEXT, TEXT, JSONB) CASCADE;
-- Also drop any other possible variant that might have been created
DROP FUNCTION IF EXISTS create_notification() CASCADE;

-- 3. Cleanup unused triggers if any were added
-- =====================================================
-- The 'trigger_application_status_change' was modified but not added as new.
-- It's usually safe to leave it as it defaults back to original behavior 
-- if the columns it references are gone.

-- DONE!
