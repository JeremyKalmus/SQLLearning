-- Migration: Create Tutorials Feature Tables
-- Feature 2: Interactive SQL Concept Tutorials with Micro-Challenges
-- This migration creates all tables needed for the tutorials feature

-- ============================================================================
-- 1. Create `tutorials` table
-- ============================================================================
CREATE TABLE IF NOT EXISTS tutorials (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL, -- 'intro-to-window-functions'
  title TEXT NOT NULL,
  description TEXT,
  difficulty_tier TEXT NOT NULL CHECK (difficulty_tier IN ('basic', 'intermediate', 'advanced', 'expert')),
  topic TEXT NOT NULL REFERENCES sql_topics(topic_name),
  prerequisites TEXT[], -- array of tutorial slugs
  order_index INTEGER NOT NULL,
  content JSONB NOT NULL, -- structured tutorial content
  estimated_time_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tutorials_difficulty ON tutorials(difficulty_tier);
CREATE INDEX idx_tutorials_topic ON tutorials(topic);
CREATE INDEX idx_tutorials_order ON tutorials(order_index);

-- ============================================================================
-- 2. Create `tutorial_progress` table (per user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tutorial_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_id INTEGER REFERENCES tutorials(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_data JSONB DEFAULT '{}', -- track section completions, challenge scores
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  last_accessed TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tutorial_id)
);

CREATE INDEX idx_tutorial_progress_user ON tutorial_progress(user_id);
CREATE INDEX idx_tutorial_progress_status ON tutorial_progress(user_id, status);

-- Enable RLS
ALTER TABLE tutorial_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tutorial progress"
  ON tutorial_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutorial progress"
  ON tutorial_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutorial progress"
  ON tutorial_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. Create `micro_challenges` table
-- ============================================================================
CREATE TABLE IF NOT EXISTS micro_challenges (
  id SERIAL PRIMARY KEY,
  tutorial_id INTEGER REFERENCES tutorials(id) ON DELETE CASCADE,
  challenge_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('write_query', 'fill_blank', 'multiple_choice', 'modify_query')),
  challenge_data JSONB NOT NULL, -- stores challenge-specific config
  solution_query TEXT,
  solution_explanation TEXT,
  hints TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_micro_challenges_tutorial ON micro_challenges(tutorial_id);

-- ============================================================================
-- 4. Create `challenge_submissions` table
-- ============================================================================
CREATE TABLE IF NOT EXISTS challenge_submissions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id INTEGER REFERENCES micro_challenges(id) ON DELETE CASCADE,
  tutorial_id INTEGER REFERENCES tutorials(id) ON DELETE CASCADE,
  submitted_query TEXT,
  is_correct BOOLEAN,
  score INTEGER, -- 0-100
  feedback TEXT,
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_challenge_submissions_user ON challenge_submissions(user_id);
CREATE INDEX idx_challenge_submissions_challenge ON challenge_submissions(challenge_id);

-- Enable RLS
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own challenge submissions"
  ON challenge_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge submissions"
  ON challenge_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. Create helper function: update_tutorial_challenge_progress
-- ============================================================================
CREATE OR REPLACE FUNCTION update_tutorial_challenge_progress(
  p_user_id UUID,
  p_tutorial_id INTEGER,
  p_challenge_id INTEGER,
  p_score INTEGER
)
RETURNS void AS $$
DECLARE
  total_challenges INTEGER;
  completed_challenges INTEGER;
BEGIN
  -- Get or create progress record
  INSERT INTO tutorial_progress (user_id, tutorial_id, status, progress_data, started_at)
  VALUES (p_user_id, p_tutorial_id, 'in_progress', '{"challenges": {}}'::jsonb, NOW())
  ON CONFLICT (user_id, tutorial_id) DO NOTHING;

  -- Update progress data
  UPDATE tutorial_progress
  SET
    progress_data = jsonb_set(
      COALESCE(progress_data, '{}'::jsonb),
      ARRAY['challenges', p_challenge_id::text],
      jsonb_build_object('completed', true, 'score', p_score, 'completedAt', NOW()::text)
    ),
    last_accessed = NOW(),
    status = 'in_progress'
  WHERE user_id = p_user_id AND tutorial_id = p_tutorial_id;

  -- Check if all challenges completed, mark tutorial complete
  SELECT COUNT(*) INTO total_challenges
  FROM micro_challenges
  WHERE tutorial_id = p_tutorial_id;

  SELECT COUNT(*) INTO completed_challenges
  FROM challenge_submissions cs
  WHERE cs.user_id = p_user_id
    AND cs.tutorial_id = p_tutorial_id
    AND cs.is_correct = true;

  -- Mark tutorial as completed if all challenges are done
  IF completed_challenges >= total_challenges AND total_challenges > 0 THEN
    UPDATE tutorial_progress
    SET
      status = 'completed',
      completed_at = NOW()
    WHERE user_id = p_user_id AND tutorial_id = p_tutorial_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

