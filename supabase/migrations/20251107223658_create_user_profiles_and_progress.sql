/*
  # Create User Profiles and Progress Tracking Tables

  ## Overview
  This migration creates tables for user profiles, API key storage, and all
  progress tracking. Each user has isolated access to their own data.

  ## Tables Created

  ### 1. user_profiles
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. user_api_keys
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Reference to user profile
  - `encrypted_api_key` (text) - Encrypted Anthropic API key
  - `is_valid` (boolean) - Whether key has been validated
  - `last_validated` (timestamptz) - Last validation timestamp
  - `created_at` (timestamptz) - Key creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. flashcard_progress
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Reference to user
  - `card_id` (text) - Flashcard identifier
  - `times_seen` (int) - Number of times card was reviewed
  - `times_correct` (int) - Number of correct answers
  - `last_seen` (timestamptz) - Last review timestamp
  - `difficulty` (int) - Spaced repetition difficulty level
  - `topic` (text) - Card topic
  - `level` (text) - Card difficulty level

  ### 4. flashcard_options
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Reference to user
  - `card_id` (text) - Flashcard identifier
  - `options` (jsonb) - Multiple choice options
  - `created_at` (timestamptz) - Creation timestamp

  ### 5. saved_problems
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Reference to user
  - `problem_data` (jsonb) - Complete problem data
  - `created_at` (timestamptz) - Creation timestamp
  - `last_accessed` (timestamptz) - Last access timestamp

  ### 6. problem_history
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Reference to user
  - `problem_title` (text) - Problem title
  - `difficulty` (text) - Problem difficulty
  - `topic` (text) - Problem topic
  - `query` (text) - User's SQL query
  - `score` (int) - Score received (0-100)
  - `correct` (boolean) - Whether answer was correct
  - `created_at` (timestamptz) - Attempt timestamp

  ### 7. user_statistics
  - `user_id` (uuid, primary key) - Reference to user
  - `total_problems_attempted` (int) - Total problems attempted
  - `total_problems_solved` (int) - Total problems solved correctly
  - `total_flashcards_reviewed` (int) - Total flashcard reviews
  - `total_xp` (int) - Total experience points earned
  - `current_streak` (int) - Current daily streak
  - `longest_streak` (int) - Longest daily streak
  - `last_activity_date` (date) - Last activity date
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - All tables have RLS enabled
  - Users can only access their own data
  - API keys are encrypted before storage
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_api_keys table
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  encrypted_api_key TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT false,
  last_validated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create flashcard_progress table
CREATE TABLE IF NOT EXISTS flashcard_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  last_seen TIMESTAMPTZ DEFAULT now(),
  difficulty INTEGER DEFAULT 0,
  topic TEXT,
  level TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, card_id)
);

-- Create flashcard_options table
CREATE TABLE IF NOT EXISTS flashcard_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  options JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, card_id)
);

-- Create saved_problems table
CREATE TABLE IF NOT EXISTS saved_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  problem_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_accessed TIMESTAMPTZ DEFAULT now()
);

-- Create problem_history table
CREATE TABLE IF NOT EXISTS problem_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  problem_title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  topic TEXT,
  query TEXT NOT NULL,
  score INTEGER NOT NULL,
  correct BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_statistics table
CREATE TABLE IF NOT EXISTS user_statistics (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  total_problems_attempted INTEGER DEFAULT 0,
  total_problems_solved INTEGER DEFAULT 0,
  total_flashcards_reviewed INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_api_keys
CREATE POLICY "Users can view own API key"
  ON user_api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API key"
  ON user_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API key"
  ON user_api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API key"
  ON user_api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for flashcard_progress
CREATE POLICY "Users can view own flashcard progress"
  ON flashcard_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcard progress"
  ON flashcard_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard progress"
  ON flashcard_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for flashcard_options
CREATE POLICY "Users can view own flashcard options"
  ON flashcard_options FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcard options"
  ON flashcard_options FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for saved_problems
CREATE POLICY "Users can view own saved problems"
  ON saved_problems FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved problems"
  ON saved_problems FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved problems"
  ON saved_problems FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved problems"
  ON saved_problems FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for problem_history
CREATE POLICY "Users can view own problem history"
  ON problem_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own problem history"
  ON problem_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_statistics
CREATE POLICY "Users can view own statistics"
  ON user_statistics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statistics"
  ON user_statistics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics"
  ON user_statistics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_user_id ON flashcard_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_card_id ON flashcard_progress(card_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_options_user_id ON flashcard_options(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_problems_user_id ON saved_problems(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_history_user_id ON problem_history(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_history_created_at ON problem_history(created_at DESC);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  INSERT INTO public.user_statistics (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_statistics_updated_at
  BEFORE UPDATE ON user_statistics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
