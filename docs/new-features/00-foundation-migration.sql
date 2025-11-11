-- Foundation Migration for New Features
-- Run this FIRST before starting parallel agent development
-- This establishes shared schema that all three features will reference

-- ============================================================================
-- SHARED: SQL Topics/Skills Taxonomy
-- ============================================================================
-- This table defines the canonical list of SQL skills/topics
-- All three features reference these same skill names

CREATE TABLE IF NOT EXISTS sql_topics (
  id SERIAL PRIMARY KEY,
  topic_name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('basic', 'intermediate', 'advanced', 'expert')),
  description TEXT,
  prerequisites TEXT[], -- array of prerequisite topic_name values
  difficulty_tier TEXT NOT NULL CHECK (difficulty_tier IN ('basic', 'intermediate', 'intermediate+', 'advanced-', 'advanced', 'advanced+', 'expert')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sql_topics_difficulty ON sql_topics(difficulty_tier);
CREATE INDEX idx_sql_topics_category ON sql_topics(category);

-- Seed the canonical topic list
INSERT INTO sql_topics (topic_name, category, description, difficulty_tier, prerequisites) VALUES
  -- Basic Skills
  ('SELECT Fundamentals', 'basic', 'Basic SELECT statements and column selection', 'basic', '{}'),
  ('WHERE Clause', 'basic', 'Filtering rows with WHERE conditions', 'basic', ARRAY['SELECT Fundamentals']),
  ('ORDER BY', 'basic', 'Sorting query results', 'basic', ARRAY['SELECT Fundamentals']),
  ('DISTINCT', 'basic', 'Removing duplicate rows', 'basic', ARRAY['SELECT Fundamentals']),
  ('NULL Handling', 'basic', 'Working with NULL values', 'basic', ARRAY['WHERE Clause']),

  -- Intermediate Skills
  ('JOINs', 'intermediate', 'INNER, LEFT, RIGHT, and FULL OUTER joins', 'intermediate', ARRAY['WHERE Clause']),
  ('Aggregates', 'intermediate', 'COUNT, SUM, AVG, MIN, MAX functions', 'intermediate', ARRAY['SELECT Fundamentals']),
  ('GROUP BY', 'intermediate', 'Grouping rows for aggregate calculations', 'intermediate', ARRAY['Aggregates']),
  ('HAVING', 'intermediate', 'Filtering grouped results', 'intermediate', ARRAY['GROUP BY']),
  ('Multiple Tables', 'intermediate', 'Querying across multiple related tables', 'intermediate', ARRAY['JOINs']),

  -- Advanced Skills
  ('Window Functions', 'advanced', 'ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, analytical functions', 'advanced', ARRAY['GROUP BY', 'ORDER BY']),
  ('CTEs', 'advanced', 'Common Table Expressions with WITH clause', 'advanced', ARRAY['Subqueries']),
  ('Subqueries', 'advanced', 'Scalar, correlated, IN, EXISTS subqueries', 'advanced', ARRAY['WHERE Clause', 'JOINs']),
  ('Self-Joins', 'advanced', 'Joining a table to itself', 'advanced', ARRAY['JOINs']),
  ('CASE Statements', 'advanced', 'Conditional logic in queries', 'advanced', ARRAY['WHERE Clause']),
  ('Date/Time Functions', 'advanced', 'Date manipulation and time-based calculations', 'advanced', ARRAY['SELECT Fundamentals']),

  -- Expert Skills
  ('Recursive CTEs', 'expert', 'Recursive Common Table Expressions', 'expert', ARRAY['CTEs']),
  ('Advanced Analytics', 'expert', 'Complex analytical queries and calculations', 'expert', ARRAY['Window Functions']),
  ('Query Optimization', 'expert', 'Performance tuning and optimization techniques', 'expert', ARRAY['JOINs', 'Subqueries'])
ON CONFLICT (topic_name) DO NOTHING;

-- ============================================================================
-- FEATURE 1: Topic-Based Filtering - Table Modifications
-- ============================================================================
-- Add topic/sub-difficulty columns to existing tables

-- Add columns to saved_problems
ALTER TABLE saved_problems
ADD COLUMN IF NOT EXISTS sub_difficulty TEXT CHECK (sub_difficulty IN ('intermediate+', 'advanced-', 'advanced+')),
ADD COLUMN IF NOT EXISTS primary_topic TEXT REFERENCES sql_topics(topic_name),
ADD COLUMN IF NOT EXISTS secondary_topics TEXT[],
ADD COLUMN IF NOT EXISTS concept_tags TEXT[];

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_saved_problems_sub_difficulty ON saved_problems(sub_difficulty);
CREATE INDEX IF NOT EXISTS idx_saved_problems_primary_topic ON saved_problems(primary_topic);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_problems'
      AND column_name = 'difficulty'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_saved_problems_difficulty_topic ON saved_problems(difficulty, primary_topic)';
  END IF;
END;
$$;

-- Add columns to problem_history
ALTER TABLE problem_history
ADD COLUMN IF NOT EXISTS sub_difficulty TEXT CHECK (sub_difficulty IN ('intermediate+', 'advanced-', 'advanced+')),
ADD COLUMN IF NOT EXISTS primary_topic TEXT REFERENCES sql_topics(topic_name);

-- ============================================================================
-- SHARED: Constants and Helper Functions
-- ============================================================================

-- Helper function to validate topic names
CREATE OR REPLACE FUNCTION validate_topic_name(topic TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM sql_topics WHERE topic_name = topic);
END;
$$ LANGUAGE plpgsql;

-- Helper function to get topics by difficulty
CREATE OR REPLACE FUNCTION get_topics_by_difficulty(difficulty_level TEXT)
RETURNS TABLE (topic_name TEXT, description TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT st.topic_name, st.description
  FROM sql_topics st
  WHERE st.difficulty_tier LIKE difficulty_level || '%'
  OR st.category = difficulty_level
  ORDER BY st.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- NOTES FOR PARALLEL DEVELOPMENT
-- ============================================================================

-- Feature 1 Agent: You can now create additional tables/functions as needed
--   - Your migration should be named: 20250111_120001_topic_filtering_additional.sql
--   - Focus on UI components and AI prompt updates
--   - Reference sql_topics table for topic validation

-- Feature 2 Agent: Create your tutorial tables independently
--   - Your migration should be named: 20250111_120002_create_tutorials.sql
--   - Reference sql_topics.topic_name for tutorial.topic field
--   - No conflicts with other features

-- Feature 3 Agent: Create your assessment tables independently
--   - Your migration should be named: 20250111_120003_create_assessments.sql
--   - Use sql_topics for skill names in assessment_questions.specific_skills[]
--   - Store skill scores using topic_name as keys in JSONB

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify topics are seeded
-- SELECT * FROM sql_topics ORDER BY category, id;

-- Verify columns added to existing tables
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'saved_problems' AND column_name LIKE '%topic%';

-- Test helper functions
-- SELECT * FROM get_topics_by_difficulty('advanced');
-- SELECT validate_topic_name('Window Functions'); -- should return true
-- SELECT validate_topic_name('Invalid Topic'); -- should return false
