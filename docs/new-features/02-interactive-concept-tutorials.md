# Feature Implementation: Interactive SQL Concept Tutorials with Micro-Challenges

## Overview
Create a new "Learn" section that provides interactive, step-by-step tutorials for SQL concepts with hands-on micro-challenges. This bridges the gap between flashcard memorization and full problem-solving by teaching concepts through executable examples and focused practice.

## Current System Context

### Existing Learning Features
- **Flashcards**: 20 cards (5 per difficulty level) with multiple choice quizzes
- **Problems**: Full problem-solving with AI feedback
- **Cheat Sheet**: SQL syntax reference (460+ lines)
- **Gap**: No structured learning path or concept-building exercises

### Current Navigation
```
Home → Problems → Flashcards → Settings
```

**New Navigation:**
```
Home → Learn → Problems → Flashcards → Settings
```

## Feature Requirements

### 1. Tutorial Structure
Each tutorial should include:
- **Concept Introduction**: What is it? Why use it? When to use it?
- **Visual Examples**: Executable SQL with sample data and results
- **Step-by-Step Walkthrough**: Breaking down a complex query
- **Interactive Sandbox**: Modify working queries to learn
- **Micro-Challenges**: 3-5 focused practice problems
- **Completion Badge**: Track completed tutorials

### 2. Tutorial Topics (Priority Order)

#### Bridge Topics (Intermediate → Advanced)
1. **Introduction to Window Functions**
   - ROW_NUMBER() basics
   - PARTITION BY concept
   - ORDER BY within windows
   - Micro-challenges: Ranking problems

2. **Common Table Expressions (CTEs)**
   - WITH clause syntax
   - Multiple CTEs
   - When to use vs subqueries
   - Micro-challenges: Refactoring subqueries to CTEs

3. **Subqueries Fundamentals**
   - Scalar subqueries
   - IN and EXISTS
   - Correlated subqueries
   - Micro-challenges: Various subquery patterns

4. **Self-Joins Explained**
   - Joining a table to itself
   - Use cases (hierarchies, comparisons)
   - Aliasing strategies
   - Micro-challenges: Employee manager hierarchies

5. **CASE Statements**
   - Simple CASE
   - Searched CASE
   - CASE in different clauses
   - Micro-challenges: Conditional aggregations

#### Advanced Topics
6. **Advanced Window Functions**
   - RANK vs DENSE_RANK vs ROW_NUMBER
   - LAG and LEAD
   - Running totals (SUM OVER)
   - Moving averages
   - Micro-challenges: Time-series analysis

7. **Recursive CTEs**
   - Base case and recursive case
   - UNION ALL structure
   - Common patterns (tree traversal, number series)
   - Micro-challenges: Organizational hierarchies

8. **Query Optimization Basics**
   - Index usage
   - JOIN order
   - WHERE vs HAVING
   - Micro-challenges: Refactoring for performance

### 3. Interactive Components

#### A. Code Editor with Live Execution
- Use existing CodeMirror setup from Problems page
- Execute against practice database
- Show results in real-time
- Highlight errors clearly

#### B. Guided Examples
- Pre-filled queries with explanations
- "Run this" buttons with expected output
- Annotations explaining each clause

#### C. Fill-in-the-Blank Challenges
- Provide query structure with blanks
- User fills in specific clauses
- Instant validation
- Show correct answer with explanation

#### D. Modify & Experiment
- Working query provided
- Tasks: "Change ORDER BY to see different results"
- Encourages exploration

### 4. Progress Tracking
- Mark tutorials as complete
- Track micro-challenge scores
- Show completion percentage per tutorial
- Badge system for milestones

## Technical Implementation

### Database Schema

#### 1. Create `tutorials` table
```sql
CREATE TABLE tutorials (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL, -- 'intro-to-window-functions'
  title TEXT NOT NULL,
  description TEXT,
  difficulty_tier TEXT NOT NULL CHECK (difficulty_tier IN ('basic', 'intermediate', 'advanced', 'expert')),
  topic TEXT NOT NULL,
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
```

#### 2. Create `tutorial_progress` table (per user)
```sql
CREATE TABLE tutorial_progress (
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
```

#### 3. Create `micro_challenges` table
```sql
CREATE TABLE micro_challenges (
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
```

#### 4. Create `challenge_submissions` table
```sql
CREATE TABLE challenge_submissions (
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
```

### Tutorial Content Structure (JSONB)

```typescript
interface TutorialContent {
  sections: TutorialSection[];
  metadata: {
    author?: string;
    version: string;
    lastUpdated: string;
  };
}

interface TutorialSection {
  type: 'introduction' | 'example' | 'explanation' | 'interactive' | 'challenge' | 'summary';
  title: string;
  order: number;
  content: SectionContent;
}

type SectionContent =
  | IntroductionContent
  | ExampleContent
  | ExplanationContent
  | InteractiveContent
  | ChallengeContent
  | SummaryContent;

interface IntroductionContent {
  text: string; // markdown
  keyPoints: string[];
  useCases: string[];
}

interface ExampleContent {
  description: string;
  query: string;
  expectedResults?: any[]; // optional pre-computed results
  explanation: string;
  annotations?: QueryAnnotation[]; // line-by-line explanations
}

interface QueryAnnotation {
  line: number;
  text: string;
}

interface ExplanationContent {
  text: string; // markdown
  codeSnippets?: CodeSnippet[];
  diagrams?: string[]; // URLs or base64 images
}

interface CodeSnippet {
  code: string;
  language: string;
  caption?: string;
}

interface InteractiveContent {
  instructions: string;
  starterQuery: string;
  tasks: InteractiveTask[];
}

interface InteractiveTask {
  taskNumber: number;
  instruction: string;
  hint?: string;
  validationQuery?: string; // optional: check if user query produces expected result
}

interface ChallengeContent {
  challengeId: number; // reference to micro_challenges table
  displayInline: boolean; // show challenge in tutorial flow or link to separate page
}

interface SummaryContent {
  keyTakeaways: string[];
  nextSteps: string[];
  relatedTutorials: string[]; // slugs of related tutorials
}
```

### Backend: Supabase Edge Functions

#### 1. Create `supabase/functions/get-tutorials/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const { difficulty, topic } = await req.json();

  let query = supabase
    .from('tutorials')
    .select('*')
    .order('order_index', { ascending: true });

  if (difficulty) {
    query = query.eq('difficulty_tier', difficulty);
  }

  if (topic) {
    query = query.eq('topic', topic);
  }

  const { data: tutorials, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get user progress if authenticated
  const authHeader = req.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (user) {
      const { data: progress } = await supabase
        .from('tutorial_progress')
        .select('*')
        .eq('user_id', user.id);

      // Merge progress into tutorials
      const tutorialsWithProgress = tutorials.map(tutorial => {
        const userProgress = progress?.find(p => p.tutorial_id === tutorial.id);
        return {
          ...tutorial,
          userProgress: userProgress || { status: 'not_started' }
        };
      });

      return new Response(JSON.stringify(tutorialsWithProgress), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify(tutorials), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### 2. Create `supabase/functions/check-micro-challenge/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';

serve(async (req) => {
  const { challengeId, submittedQuery, tutorialId } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  // Get user from auth token
  const authHeader = req.headers.get('Authorization')!;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);

  // Get challenge details
  const { data: challenge } = await supabase
    .from('micro_challenges')
    .select('*')
    .eq('id', challengeId)
    .single();

  // Execute the query
  let executionResult;
  let executionError = null;
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      query: submittedQuery
    });
    if (error) throw error;
    executionResult = data;
  } catch (error) {
    executionError = error.message;
  }

  if (executionError) {
    return new Response(JSON.stringify({
      isCorrect: false,
      score: 0,
      feedback: `Query execution error: ${executionError}`,
      executionError
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get user API key
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('anthropic_api_key_encrypted')
    .eq('id', user.id)
    .single();

  const apiKey = profile.anthropic_api_key_encrypted;
  const anthropic = new Anthropic({ apiKey });

  // Use AI to check answer
  const prompt = `You are checking a student's SQL query for a micro-challenge.

Challenge: ${challenge.title}
Description: ${challenge.description}

Expected Solution:
${challenge.solution_query}

Student's Query:
${submittedQuery}

Query Results: ${JSON.stringify(executionResult)}

Evaluate the student's query:
1. Is it correct? (does it solve the challenge?)
2. Give a score from 0-100
3. Provide specific feedback
4. If incorrect, give a hint without revealing the exact answer

Respond in JSON format:
{
  "isCorrect": boolean,
  "score": number,
  "feedback": string,
  "hint": string (if incorrect)
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });

  const evaluation = JSON.parse(message.content[0].text);

  // Count attempts
  const { count } = await supabase
    .from('challenge_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId);

  const attemptNumber = (count || 0) + 1;

  // Save submission
  await supabase.from('challenge_submissions').insert({
    user_id: user.id,
    challenge_id: challengeId,
    tutorial_id: tutorialId,
    submitted_query: submittedQuery,
    is_correct: evaluation.isCorrect,
    score: evaluation.score,
    feedback: evaluation.feedback,
    attempt_number: attemptNumber
  });

  // Update tutorial progress
  if (evaluation.isCorrect) {
    await supabase.rpc('update_tutorial_challenge_progress', {
      p_user_id: user.id,
      p_tutorial_id: tutorialId,
      p_challenge_id: challengeId,
      p_score: evaluation.score
    });
  }

  return new Response(JSON.stringify({
    ...evaluation,
    attemptNumber
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### 3. Create helper function in SQL
```sql
-- Update tutorial progress when challenge is completed
CREATE OR REPLACE FUNCTION update_tutorial_challenge_progress(
  p_user_id UUID,
  p_tutorial_id INTEGER,
  p_challenge_id INTEGER,
  p_score INTEGER
)
RETURNS void AS $$
DECLARE
  current_progress JSONB;
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
      jsonb_build_object('completed', true, 'score', p_score, 'completedAt', NOW())
    ),
    last_accessed = NOW(),
    status = 'in_progress'
  WHERE user_id = p_user_id AND tutorial_id = p_tutorial_id;

  -- Check if all challenges completed, mark tutorial complete
  -- (This logic depends on how you determine completion)
END;
$$ LANGUAGE plpgsql;
```

### Frontend Implementation

#### 1. Create New Page: `src/pages/Learn.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import TutorialCard from './Learn/components/TutorialCard';
import TutorialFilter from './Learn/components/TutorialFilter';

export default function Learn() {
  const { session } = useAuth();
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');

  useEffect(() => {
    fetchTutorials();
  }, [selectedDifficulty, selectedTopic]);

  const fetchTutorials = async () => {
    setLoading(true);

    const filters = {};
    if (selectedDifficulty !== 'all') filters.difficulty = selectedDifficulty;
    if (selectedTopic !== 'all') filters.topic = selectedTopic;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-tutorials`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(filters)
      }
    );

    const data = await response.json();
    setTutorials(data);
    setLoading(false);
  };

  return (
    <div className="learn-page max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learn SQL Concepts</h1>
        <p className="text-gray-600">
          Master SQL through interactive tutorials and hands-on micro-challenges
        </p>
      </header>

      <TutorialFilter
        selectedDifficulty={selectedDifficulty}
        selectedTopic={selectedTopic}
        onDifficultyChange={setSelectedDifficulty}
        onTopicChange={setSelectedTopic}
      />

      {loading ? (
        <div className="text-center py-12">Loading tutorials...</div>
      ) : (
        <div className="tutorials-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {tutorials.map(tutorial => (
            <TutorialCard
              key={tutorial.id}
              tutorial={tutorial}
              userProgress={tutorial.userProgress}
            />
          ))}
        </div>
      )}

      {tutorials.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No tutorials found. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}
```

#### 2. Create Component: `src/pages/Learn/components/TutorialCard.jsx`

```jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function TutorialCard({ tutorial, userProgress }) {
  const status = userProgress?.status || 'not_started';
  const progressPercentage = calculateProgress(tutorial, userProgress);

  return (
    <Link
      to={`/learn/${tutorial.slug}`}
      className="tutorial-card block p-6 border rounded-lg hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-semibold">{tutorial.title}</h3>
        {status === 'completed' && (
          <span className="text-green-500 text-2xl">✓</span>
        )}
      </div>

      <p className="text-gray-600 text-sm mb-4">{tutorial.description}</p>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
          {tutorial.difficulty_tier}
        </span>
        <span className="text-gray-500">
          {tutorial.estimated_time_minutes} min
        </span>
      </div>

      {status !== 'not_started' && (
        <div className="progress-bar">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 mt-1">
            {progressPercentage}% complete
          </span>
        </div>
      )}

      <div className="mt-4">
        {status === 'not_started' && (
          <span className="text-blue-600 font-medium">Start Learning →</span>
        )}
        {status === 'in_progress' && (
          <span className="text-orange-600 font-medium">Continue →</span>
        )}
        {status === 'completed' && (
          <span className="text-green-600 font-medium">Review →</span>
        )}
      </div>
    </Link>
  );
}

function calculateProgress(tutorial, userProgress) {
  if (!userProgress?.progress_data?.challenges) return 0;

  const totalChallenges = Object.keys(tutorial.content.sections)
    .filter(key => tutorial.content.sections[key].type === 'challenge')
    .length;

  if (totalChallenges === 0) return 100;

  const completedChallenges = Object.values(
    userProgress.progress_data.challenges
  ).filter(c => c.completed).length;

  return Math.round((completedChallenges / totalChallenges) * 100);
}
```

#### 3. Create Tutorial View Page: `src/pages/Learn/TutorialView.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TutorialSection from './components/TutorialSection';
import TutorialProgress from './components/TutorialProgress';

export default function TutorialView() {
  const { slug } = useParams();
  const { session } = useAuth();
  const [tutorial, setTutorial] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTutorial();
    markTutorialStarted();
  }, [slug]);

  const fetchTutorial = async () => {
    const { data: tutorial } = await supabase
      .from('tutorials')
      .select('*')
      .eq('slug', slug)
      .single();

    const { data: progress } = await supabase
      .from('tutorial_progress')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('tutorial_id', tutorial.id)
      .single();

    setTutorial(tutorial);
    setUserProgress(progress);
    setLoading(false);
  };

  const markTutorialStarted = async () => {
    // Mark as started if not already
    await supabase.from('tutorial_progress').upsert({
      user_id: session.user.id,
      tutorial_id: tutorial?.id,
      status: 'in_progress',
      started_at: new Date().toISOString()
    }, { onConflict: ['user_id', 'tutorial_id'] });
  };

  if (loading) return <div>Loading...</div>;

  const sections = tutorial.content.sections.sort((a, b) => a.order - b.order);

  return (
    <div className="tutorial-view max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{tutorial.title}</h1>
        <p className="text-gray-600">{tutorial.description}</p>
        <TutorialProgress
          currentSection={currentSection}
          totalSections={sections.length}
          userProgress={userProgress}
        />
      </header>

      <div className="tutorial-content">
        <TutorialSection
          section={sections[currentSection]}
          tutorialId={tutorial.id}
          onComplete={() => handleSectionComplete(currentSection)}
        />
      </div>

      <div className="navigation-buttons flex justify-between mt-8">
        <button
          onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
          disabled={currentSection === 0}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          ← Previous
        </button>

        <button
          onClick={() => setCurrentSection(prev => Math.min(sections.length - 1, prev + 1))}
          disabled={currentSection === sections.length - 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
```

#### 4. Create Section Renderer: `src/pages/Learn/components/TutorialSection.jsx`

This component renders different section types:

```jsx
import React from 'react';
import IntroductionSection from './sections/IntroductionSection';
import ExampleSection from './sections/ExampleSection';
import ExplanationSection from './sections/ExplanationSection';
import InteractiveSection from './sections/InteractiveSection';
import ChallengeSection from './sections/ChallengeSection';
import SummarySection from './sections/SummarySection';

export default function TutorialSection({ section, tutorialId, onComplete }) {
  const renderSection = () => {
    switch (section.type) {
      case 'introduction':
        return <IntroductionSection content={section.content} />;
      case 'example':
        return <ExampleSection content={section.content} />;
      case 'explanation':
        return <ExplanationSection content={section.content} />;
      case 'interactive':
        return <InteractiveSection content={section.content} />;
      case 'challenge':
        return (
          <ChallengeSection
            content={section.content}
            tutorialId={tutorialId}
            onComplete={onComplete}
          />
        );
      case 'summary':
        return <SummarySection content={section.content} />;
      default:
        return <div>Unknown section type</div>;
    }
  };

  return (
    <div className="tutorial-section">
      <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
      {renderSection()}
    </div>
  );
}
```

#### 5. Create Interactive Micro-Challenge Component: `src/pages/Learn/components/sections/ChallengeSection.jsx`

```jsx
import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { useAuth } from '../../../../contexts/AuthContext';

export default function ChallengeSection({ content, tutorialId, onComplete }) {
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-micro-challenge`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          challengeId: content.challengeId,
          submittedQuery: query,
          tutorialId
        })
      }
    );

    const result = await response.json();
    setFeedback(result);
    setLoading(false);

    if (result.isCorrect) {
      setTimeout(() => onComplete(), 2000);
    }
  };

  return (
    <div className="challenge-section">
      <div className="challenge-description bg-blue-50 p-4 rounded-lg mb-4">
        <h3 className="font-semibold mb-2">Challenge</h3>
        <p>{content.description}</p>
      </div>

      <div className="code-editor mb-4">
        <CodeMirror
          value={query}
          height="200px"
          extensions={[sql()]}
          onChange={(value) => setQuery(value)}
          theme="light"
        />
      </div>

      <div className="actions flex gap-3 mb-4">
        <button
          onClick={handleSubmit}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Submit Answer'}
        </button>

        <button
          onClick={() => setShowHint(!showHint)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          {showHint ? 'Hide Hint' : 'Show Hint'}
        </button>
      </div>

      {showHint && (
        <div className="hint bg-yellow-50 p-4 rounded-lg mb-4">
          <strong>Hint:</strong> {content.hint || 'No hint available'}
        </div>
      )}

      {feedback && (
        <div
          className={`feedback p-4 rounded-lg ${
            feedback.isCorrect ? 'bg-green-50' : 'bg-red-50'
          }`}
        >
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">
              {feedback.isCorrect ? '✓' : '✗'}
            </span>
            <strong>
              {feedback.isCorrect ? 'Correct!' : 'Not quite right'}
            </strong>
          </div>
          <p className="text-sm">{feedback.feedback}</p>
          {feedback.score && (
            <div className="mt-2 text-sm">Score: {feedback.score}/100</div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Seeding Tutorial Content

Create a seed script: `scripts/seed-tutorials.js`

```javascript
// Example: Window Functions Tutorial
const windowFunctionsTutorial = {
  slug: 'intro-to-window-functions',
  title: 'Introduction to Window Functions',
  description: 'Learn how to use window functions for advanced data analysis',
  difficulty_tier: 'advanced',
  topic: 'Window Functions',
  prerequisites: ['intermediate-joins', 'advanced-aggregates'],
  order_index: 1,
  estimated_time_minutes: 30,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'What are Window Functions?',
        order: 1,
        content: {
          text: `Window functions perform calculations across a set of rows related to the current row, without collapsing the result set like GROUP BY does.`,
          keyPoints: [
            'Calculate running totals and moving averages',
            'Rank rows within partitions',
            'Access data from other rows without self-joins'
          ],
          useCases: [
            'Ranking products by sales within each category',
            'Calculating running totals of orders',
            'Comparing each row to the previous row'
          ]
        }
      },
      {
        type: 'example',
        title: 'Your First Window Function',
        order: 2,
        content: {
          description: 'Let\'s rank products by price within each category',
          query: `SELECT
  product_name,
  category,
  price,
  ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) as price_rank
FROM products
ORDER BY category, price_rank;`,
          explanation: 'This query assigns a rank to each product within its category based on price.',
          annotations: [
            { line: 4, text: 'ROW_NUMBER() assigns a unique number to each row' },
            { line: 4, text: 'PARTITION BY creates separate "windows" for each category' },
            { line: 4, text: 'ORDER BY determines the ranking order within each partition' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Modify the query to experiment with window functions',
          starterQuery: `SELECT
  product_name,
  category,
  price,
  ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) as price_rank
FROM products;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Change ROW_NUMBER() to RANK() and observe the difference',
              hint: 'RANK() handles ties differently than ROW_NUMBER()'
            },
            {
              taskNumber: 2,
              instruction: 'Change the ORDER BY to sort by product_name instead of price',
              hint: 'The ORDER BY inside OVER() determines what you\'re ranking by'
            }
          ]
        }
      },
      {
        type: 'challenge',
        title: 'Micro-Challenge 1',
        order: 4,
        content: {
          challengeId: 1, // reference to micro_challenges table
          displayInline: true
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 5,
        content: {
          keyTakeaways: [
            'Window functions don\'t collapse rows like GROUP BY',
            'PARTITION BY divides data into groups',
            'ORDER BY within OVER() determines ranking order',
            'ROW_NUMBER() assigns unique ranks, RANK() allows ties'
          ],
          nextSteps: [
            'Try DENSE_RANK() for continuous ranking',
            'Explore LAG() and LEAD() for accessing other rows',
            'Learn about running totals with SUM() OVER()'
          ],
          relatedTutorials: [
            'advanced-window-functions',
            'ranking-functions-deep-dive'
          ]
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: '2025-01-15'
    }
  }
};
```

### Navigation Updates

Update `src/App.jsx` to include Learn route:

```jsx
import Learn from './pages/Learn';
import TutorialView from './pages/Learn/TutorialView';

// In routes:
<Route path="/learn" element={<Learn />} />
<Route path="/learn/:slug" element={<TutorialView />} />
```

Update navigation component to include Learn link.

## Testing Checklist

### Backend Testing
- [ ] Tutorials query with filters (difficulty, topic)
- [ ] User progress tracking creation and updates
- [ ] Micro-challenge checking with AI evaluation
- [ ] Challenge submissions save correctly
- [ ] Tutorial completion detection works
- [ ] RLS policies prevent cross-user access

### Frontend Testing
- [ ] Tutorial cards display correctly with progress
- [ ] Tutorial view renders all section types
- [ ] Code editor works in interactive sections
- [ ] Micro-challenges submit and show feedback
- [ ] Navigation between sections works
- [ ] Progress bar updates after completing challenges
- [ ] Hints show/hide correctly

### Content Testing
- [ ] Executable SQL examples run successfully
- [ ] Micro-challenges have clear descriptions
- [ ] Hints are helpful but not giving away answers
- [ ] Solutions are correct and optimal
- [ ] Difficulty progression feels smooth

### Integration Testing
- [ ] Complete tutorial start-to-finish flow
- [ ] Progress persists across sessions
- [ ] Completed tutorials marked correctly
- [ ] Related tutorial links work
- [ ] Prerequisites displayed appropriately

## Success Metrics

After implementation:
1. Users can complete a tutorial and see progress tracked
2. Micro-challenges provide immediate feedback
3. Interactive sections allow experimentation
4. Tutorial completion badges motivate users
5. Clear path from Intermediate to Advanced concepts

## Implementation Timeline

**Week 1:**
- Database schema and migrations
- Seed 2-3 initial tutorials
- Backend Edge Functions

**Week 2:**
- Frontend Learn page and tutorial cards
- Tutorial view page with section rendering
- Basic styling and navigation

**Week 3:**
- Interactive components (code editor, challenges)
- Micro-challenge checking system
- Progress tracking and badges

**Week 4:**
- Polish, testing, bug fixes
- Add 2-3 more tutorials
- User feedback and iterations

## Future Enhancements

- Video walkthroughs for complex concepts
- Community-contributed tutorials
- Tutorial ratings and reviews
- AI-generated personalized tutorial recommendations
- Downloadable practice datasets
- Tutorial playlists/learning paths

Good luck building an amazing learning experience!
