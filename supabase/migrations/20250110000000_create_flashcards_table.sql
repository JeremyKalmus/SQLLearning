-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id TEXT PRIMARY KEY, -- Use TEXT to match card_id format in flashcard_progress
  level TEXT NOT NULL, -- 'basic', 'intermediate', 'advanced', 'expert'
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  example TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_flashcards_level ON flashcards(level);
CREATE INDEX IF NOT EXISTS idx_flashcards_level_created ON flashcards(level, created_at, is_ai_generated);

-- Enable Row Level Security (read-only for all authenticated users)
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read flashcards
CREATE POLICY "Anyone can read flashcards"
  ON flashcards FOR SELECT
  USING (true);

-- RLS Policy: Allow inserts (for migrations and AI generation via Edge Functions)
-- Note: Edge Functions will use service role key, but we allow inserts for migration scripts too
CREATE POLICY "Allow flashcard inserts"
  ON flashcards FOR INSERT
  WITH CHECK (true);

