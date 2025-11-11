-- Add sub-difficulty and topic columns to saved_problems
ALTER TABLE saved_problems
ADD COLUMN IF NOT EXISTS sub_difficulty TEXT,
ADD COLUMN IF NOT EXISTS primary_topic TEXT,
ADD COLUMN IF NOT EXISTS secondary_topics TEXT[],
ADD COLUMN IF NOT EXISTS concept_tags TEXT[];

-- Add indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_saved_problems_sub_difficulty
ON saved_problems(sub_difficulty);

CREATE INDEX IF NOT EXISTS idx_saved_problems_primary_topic
ON saved_problems(primary_topic);

CREATE INDEX IF NOT EXISTS idx_saved_problems_difficulty_topic
ON saved_problems(difficulty, primary_topic);

-- Add columns to problem_history
ALTER TABLE problem_history
ADD COLUMN IF NOT EXISTS sub_difficulty TEXT,
ADD COLUMN IF NOT EXISTS primary_topic TEXT;

-- Create topics reference table
CREATE TABLE IF NOT EXISTS sql_topics (
  id SERIAL PRIMARY KEY,
  topic_name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('basic', 'intermediate', 'advanced', 'expert')),
  description TEXT,
  prerequisites TEXT[],
  difficulty_tier TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed initial topics
INSERT INTO sql_topics (topic_name, category, description, difficulty_tier) VALUES
  ('JOINs', 'intermediate', 'INNER, LEFT, RIGHT, and FULL OUTER joins', 'intermediate'),
  ('Aggregates', 'intermediate', 'GROUP BY, HAVING, COUNT, SUM, AVG, MIN, MAX', 'intermediate'),
  ('Multiple Tables', 'intermediate', 'Querying across multiple related tables', 'intermediate'),
  ('Window Functions', 'advanced', 'ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, analytical functions', 'advanced'),
  ('CTEs', 'advanced', 'Common Table Expressions with WITH clause', 'advanced'),
  ('Subqueries', 'advanced', 'Scalar, correlated, IN, EXISTS subqueries', 'advanced'),
  ('Self-Joins', 'advanced', 'Joining a table to itself', 'advanced'),
  ('CASE Statements', 'advanced', 'Conditional logic in queries', 'advanced'),
  ('Date/Time Functions', 'advanced', 'Date manipulation and time-based calculations', 'advanced'),
  ('Recursive CTEs', 'expert', 'Recursive Common Table Expressions', 'expert'),
  ('Advanced Analytics', 'expert', 'Complex analytical queries and calculations', 'expert'),
  ('Query Optimization', 'expert', 'Performance tuning and optimization techniques', 'expert')
ON CONFLICT (topic_name) DO NOTHING;

-- Create indexes on sql_topics
CREATE INDEX IF NOT EXISTS idx_sql_topics_difficulty ON sql_topics(difficulty_tier);
CREATE INDEX IF NOT EXISTS idx_sql_topics_category ON sql_topics(category);
