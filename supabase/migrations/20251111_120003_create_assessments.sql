-- ============================================================================
-- FEATURE 3: Skill Assessment & Gap Analysis
-- Migration for all assessment-related tables
-- ============================================================================

-- ============================================================================
-- 1. skill_assessments: Assessment definitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS skill_assessments (
  id SERIAL PRIMARY KEY,
  assessment_name TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT DEFAULT 'comprehensive' CHECK (assessment_type IN ('comprehensive', 'quick', 'topic_specific')),
  estimated_time_minutes INTEGER,
  questions JSONB NOT NULL DEFAULT '[]', -- array of question objects (deprecated, using assessment_questions table)
  skill_weights JSONB NOT NULL DEFAULT '{}', -- how questions map to skills
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Seed the main comprehensive assessment
INSERT INTO skill_assessments (assessment_name, description, estimated_time_minutes, skill_weights) VALUES
  ('SQL Comprehensive Assessment', 'Complete diagnostic test covering all SQL skill levels', 20, '{}')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. assessment_questions: Individual questions for assessments
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessment_questions (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER REFERENCES skill_assessments(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'write_query', 'read_query', 'find_error', 'fill_blank')),
  question_data JSONB NOT NULL,
  skill_category TEXT NOT NULL CHECK (skill_category IN ('basic', 'intermediate', 'advanced', 'expert')),
  specific_skills TEXT[] NOT NULL, -- references sql_topics.topic_name
  difficulty_weight DECIMAL DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_skills ON assessment_questions USING GIN(specific_skills);

-- ============================================================================
-- 3. user_assessments: User attempts at assessments
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_assessments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id INTEGER REFERENCES skill_assessments(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  time_spent_seconds INTEGER,
  overall_score INTEGER, -- 0-100
  skill_scores JSONB DEFAULT '{}', -- { "JOINs": 85, "Window Functions": 45, ... }
  recommendations JSONB DEFAULT '{}', -- personalized recommendations
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_assessments_user ON user_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_completed ON user_assessments(user_id, completed_at);

-- Enable RLS
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own assessments" ON user_assessments;
CREATE POLICY "Users can view their own assessments"
  ON user_assessments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own assessments" ON user_assessments;
CREATE POLICY "Users can insert their own assessments"
  ON user_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own assessments" ON user_assessments;
CREATE POLICY "Users can update their own assessments"
  ON user_assessments FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. assessment_responses: Individual question responses
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessment_responses (
  id SERIAL PRIMARY KEY,
  user_assessment_id INTEGER REFERENCES user_assessments(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES assessment_questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  response_data JSONB NOT NULL, -- user's answer
  is_correct BOOLEAN,
  score INTEGER, -- 0-100 for this question
  feedback TEXT,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_user_assessment ON assessment_responses(user_assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_user ON assessment_responses(user_id);

-- Enable RLS
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own responses" ON assessment_responses;
CREATE POLICY "Users can view their own responses"
  ON assessment_responses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own responses" ON assessment_responses;
CREATE POLICY "Users can insert their own responses"
  ON assessment_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. user_skill_profiles: User skill levels and recommendations
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_skill_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  skill_scores JSONB NOT NULL DEFAULT '{}', -- current skill levels
  last_assessment_id INTEGER REFERENCES user_assessments(id),
  last_assessed_at TIMESTAMP,
  recommended_level TEXT CHECK (recommended_level IN ('basic', 'intermediate', 'intermediate+', 'advanced-', 'advanced', 'advanced+', 'expert')),
  weak_skills TEXT[], -- skills below 60%
  strong_skills TEXT[], -- skills above 80%
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_skill_profiles_user ON user_skill_profiles(user_id);

-- Enable RLS
ALTER TABLE user_skill_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own skill profile" ON user_skill_profiles;
CREATE POLICY "Users can view their own skill profile"
  ON user_skill_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own skill profile" ON user_skill_profiles;
CREATE POLICY "Users can insert their own skill profile"
  ON user_skill_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own skill profile" ON user_skill_profiles;
CREATE POLICY "Users can update their own skill profile"
  ON user_skill_profiles FOR UPDATE
  USING (auth.uid() = user_id);
