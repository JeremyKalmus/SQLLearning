/*
  # Add Progress Tracking Fields

  ## Overview
  This migration adds fields to support saving query/notes progress and
  detailed submission history for problems.

  ## Changes

  ### saved_problems table
  - Add `current_query` (text) - User's current SQL query draft
  - Add `current_notes` (text) - User's notes for the problem
  - Add `problem_id` (text) - Unique identifier for the problem (indexed for history lookup)

  ### problem_history table
  - Add `feedback_data` (jsonb) - Complete AI feedback including praise, improvements, etc.
  - Add `problem_id` (text) - Unique identifier to link with saved problems

  ## Benefits
  - Auto-save user's work in progress
  - Track full submission history with detailed feedback
  - Review progress and improvement over time
*/

-- Add new columns to saved_problems
ALTER TABLE saved_problems
  ADD COLUMN IF NOT EXISTS current_query TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS current_notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS problem_id TEXT;

-- Add new columns to problem_history
ALTER TABLE problem_history
  ADD COLUMN IF NOT EXISTS feedback_data JSONB,
  ADD COLUMN IF NOT EXISTS problem_id TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_problems_problem_id ON saved_problems(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_history_problem_id ON problem_history(user_id, problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_history_user_problem ON problem_history(user_id, problem_title);

-- Add comment for documentation
COMMENT ON COLUMN saved_problems.current_query IS 'User''s current work-in-progress SQL query';
COMMENT ON COLUMN saved_problems.current_notes IS 'User''s notes for solving the problem';
COMMENT ON COLUMN saved_problems.problem_id IS 'Unique identifier for the problem';
COMMENT ON COLUMN problem_history.feedback_data IS 'Complete AI feedback data (praise, improvements, suggestions, etc.)';
COMMENT ON COLUMN problem_history.problem_id IS 'Links to the saved problem';
