# Feature Implementation: Topic-Based Filtering + Sub-Difficulties

## Overview
Enhance the problem generation and filtering system to include granular difficulty levels (sub-difficulties) and topic-based filtering. This allows users to practice specific SQL concepts and provides a smoother learning curve between difficulty levels.

## Current System Context

### Existing Difficulty Levels
- **Basic**: SELECT, WHERE, simple filtering (1-2 tables)
- **Intermediate**: JOINs, GROUP BY, aggregates (2-3 tables)
- **Advanced**: Window functions, CTEs, subqueries (3-4 tables)
- **Expert**: Recursive CTEs, complex analytics (4-6 tables)

### Current Implementation
- Difficulty stored in `saved_problems` and `problem_history` tables
- Problem generation: `supabase/functions/generate-problem/index.ts`
- Problems UI: `src/pages/Problems.jsx` and `src/pages/Problems/components/`
- No topic filtering currently exists
- Problems are generated based on difficulty tier only

## Feature Requirements

### 1. Sub-Difficulty System
Add granular difficulty levels:
- **Intermediate+**: Bridge level introducing ONE Advanced concept with Intermediate foundations
- **Advanced-**: Easy Advanced problems focusing on single concepts
- **Advanced**: Current Advanced level
- **Advanced+**: Complex Advanced problems combining multiple techniques

### 2. Topic Taxonomy
Define primary SQL topics to track:
- **Intermediate Topics**: JOINs (INNER/LEFT/RIGHT), Aggregates (GROUP BY, HAVING), Multiple Tables
- **Advanced Topics**: Window Functions, CTEs (Common Table Expressions), Subqueries (Scalar/Correlated/IN/EXISTS), Self-Joins, CASE Statements, Date/Time Functions
- **Expert Topics**: Recursive CTEs, Advanced Analytics, Query Optimization, Complex Nested Queries

### 3. Topic Filtering UI
- Add topic selector to Problems page
- Show topics relevant to selected difficulty level
- Allow "All Topics" or specific topic selection
- Visual badges showing topic tags on problems

### 4. Smart Problem Generation
- Update generation prompt to target specific topics when requested
- Ensure topic accuracy in generated problems
- Balance between requested topic and difficulty requirements

## Technical Implementation

### Database Schema Changes

#### 1. Add columns to `saved_problems` table
```sql
ALTER TABLE saved_problems
ADD COLUMN sub_difficulty TEXT,
ADD COLUMN primary_topic TEXT,
ADD COLUMN secondary_topics TEXT[],
ADD COLUMN concept_tags TEXT[];

-- Add indexes for filtering
CREATE INDEX idx_saved_problems_sub_difficulty ON saved_problems(sub_difficulty);
CREATE INDEX idx_saved_problems_primary_topic ON saved_problems(primary_topic);
CREATE INDEX idx_saved_problems_difficulty_topic ON saved_problems(difficulty, primary_topic);
```

#### 2. Add columns to `problem_history` table
```sql
ALTER TABLE problem_history
ADD COLUMN sub_difficulty TEXT,
ADD COLUMN primary_topic TEXT;
```

#### 3. Create topics reference table (optional but recommended)
```sql
CREATE TABLE sql_topics (
  id SERIAL PRIMARY KEY,
  topic_name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- 'intermediate', 'advanced', 'expert'
  description TEXT,
  prerequisites TEXT[], -- array of prerequisite topic names
  difficulty_tier TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed initial topics
INSERT INTO sql_topics (topic_name, category, description, difficulty_tier) VALUES
  ('JOINs', 'intermediate', 'INNER, LEFT, RIGHT, and FULL OUTER joins', 'intermediate'),
  ('Aggregates', 'intermediate', 'GROUP BY, HAVING, COUNT, SUM, AVG, MIN, MAX', 'intermediate'),
  ('Window Functions', 'advanced', 'ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, analytical functions', 'advanced'),
  ('CTEs', 'advanced', 'Common Table Expressions with WITH clause', 'advanced'),
  ('Subqueries', 'advanced', 'Scalar, correlated, IN, EXISTS subqueries', 'advanced'),
  ('Self-Joins', 'advanced', 'Joining a table to itself', 'advanced'),
  ('CASE Statements', 'advanced', 'Conditional logic in queries', 'advanced'),
  ('Date/Time Functions', 'advanced', 'Date manipulation and time-based calculations', 'advanced'),
  ('Recursive CTEs', 'expert', 'Recursive Common Table Expressions', 'expert'),
  ('Query Optimization', 'expert', 'Performance tuning and optimization techniques', 'expert');
```

### Backend Changes

#### Update `supabase/functions/generate-problem/index.ts`

**Key Changes:**
1. Accept new parameters: `subDifficulty`, `primaryTopic`
2. Update Claude prompt to target specific topics
3. Parse and validate topic from Claude response
4. Store topic metadata in generated problem JSON

**Example Enhanced Prompt Section:**
```typescript
const requestedTopic = primaryTopic || 'any';
const subDifficultyContext = subDifficulty
  ? `Generate a ${subDifficulty} level problem (${getSubDifficultyDescription(subDifficulty)}).`
  : '';

const topicContext = primaryTopic
  ? `REQUIRED: This problem must focus on the SQL concept: "${primaryTopic}". The problem should test and require this concept to solve correctly.`
  : 'Choose an appropriate SQL concept for the selected difficulty level.';

// Add to Claude prompt:
${subDifficultyContext}
${topicContext}

In your response, include:
- primary_topic: The main SQL concept required (e.g., "Window Functions", "CTEs", "Subqueries")
- concept_tags: Array of all SQL concepts involved (e.g., ["Window Functions", "JOINs", "Aggregates"])
```

**Function Signature Update:**
```typescript
const { difficulty, subDifficulty, primaryTopic } = await req.json();
```

**Helper Function:**
```typescript
function getSubDifficultyDescription(subDiff: string): string {
  const descriptions = {
    'intermediate+': 'Introduce ONE Advanced concept (Window Functions OR CTEs OR Subqueries) combined with Intermediate foundations (JOINs, GROUP BY)',
    'advanced-': 'Focus on a single Advanced concept with straightforward application',
    'advanced': 'Standard Advanced level combining multiple Advanced techniques',
    'advanced+': 'Complex Advanced problem requiring multiple Advanced concepts and nested structures'
  };
  return descriptions[subDiff] || '';
}
```

**Expected Response Format Update:**
```typescript
interface ProblemResponse {
  title: string;
  description: string;
  difficulty: string;
  sub_difficulty?: string;
  topic: string;
  primary_topic: string;
  concept_tags: string[];
  hints: string[];
  solution: string;
  explanation: string;
}
```

#### Update `supabase/functions/check-answer/index.ts`
- No major changes needed, but optionally include topic in feedback context
- Could mention topic mastery in feedback: "Great use of CTEs!"

### Frontend Changes

#### 1. Create Topic Filter Component
**New File:** `src/pages/Problems/components/TopicFilter.jsx`

```jsx
import React from 'react';

const TOPICS_BY_DIFFICULTY = {
  basic: [],
  intermediate: [
    { value: 'JOINs', label: 'JOINs (INNER/LEFT/RIGHT)' },
    { value: 'Aggregates', label: 'Aggregates (GROUP BY, HAVING)' },
    { value: 'Multiple Tables', label: 'Multiple Table Queries' }
  ],
  advanced: [
    { value: 'Window Functions', label: 'Window Functions' },
    { value: 'CTEs', label: 'Common Table Expressions (CTEs)' },
    { value: 'Subqueries', label: 'Subqueries' },
    { value: 'Self-Joins', label: 'Self-Joins' },
    { value: 'CASE Statements', label: 'CASE Statements' },
    { value: 'Date/Time Functions', label: 'Date/Time Functions' }
  ],
  expert: [
    { value: 'Recursive CTEs', label: 'Recursive CTEs' },
    { value: 'Advanced Analytics', label: 'Advanced Analytics' },
    { value: 'Query Optimization', label: 'Query Optimization' }
  ]
};

export default function TopicFilter({ difficulty, selectedTopic, onTopicChange }) {
  const availableTopics = TOPICS_BY_DIFFICULTY[difficulty] || [];

  if (availableTopics.length === 0) return null;

  return (
    <div className="topic-filter">
      <label htmlFor="topic-select" className="block text-sm font-medium mb-2">
        Filter by Topic (Optional)
      </label>
      <select
        id="topic-select"
        value={selectedTopic || ''}
        onChange={(e) => onTopicChange(e.target.value || null)}
        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Topics</option>
        {availableTopics.map(topic => (
          <option key={topic.value} value={topic.value}>
            {topic.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

#### 2. Create Sub-Difficulty Selector Component
**New File:** `src/pages/Problems/components/SubDifficultySelector.jsx`

```jsx
import React from 'react';

const SUB_DIFFICULTIES = {
  intermediate: [
    { value: null, label: 'Standard', description: 'Standard intermediate problems' },
    { value: 'intermediate+', label: 'Intermediate+', description: 'Bridge to Advanced - introduces one new concept' }
  ],
  advanced: [
    { value: 'advanced-', label: 'Advanced-', description: 'Easier Advanced - single concept focus' },
    { value: null, label: 'Standard', description: 'Standard advanced problems' },
    { value: 'advanced+', label: 'Advanced+', description: 'Complex Advanced - multiple concepts' }
  ]
};

export default function SubDifficultySelector({ difficulty, selectedSubDifficulty, onSubDifficultyChange }) {
  const options = SUB_DIFFICULTIES[difficulty];

  if (!options) return null;

  return (
    <div className="sub-difficulty-selector">
      <label className="block text-sm font-medium mb-2">
        Difficulty Level
      </label>
      <div className="space-y-2">
        {options.map(option => (
          <label
            key={option.value || 'standard'}
            className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <input
              type="radio"
              name="sub-difficulty"
              value={option.value || ''}
              checked={selectedSubDifficulty === option.value}
              onChange={() => onSubDifficultyChange(option.value)}
              className="mt-1 mr-3"
            />
            <div>
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-gray-600">{option.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
```

#### 3. Update `src/pages/Problems.jsx`

**State Management:**
```jsx
const [selectedTopic, setSelectedTopic] = useState(null);
const [selectedSubDifficulty, setSelectedSubDifficulty] = useState(null);
```

**Update Problem Generation Call:**
```jsx
// In useProblemGeneration hook or inline:
const generateProblem = async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-problem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      difficulty: selectedDifficulty,
      subDifficulty: selectedSubDifficulty,
      primaryTopic: selectedTopic
    })
  });
  // ... rest of implementation
};
```

**UI Integration:**
```jsx
// Add to problem generation section:
<DifficultySelector
  selectedDifficulty={selectedDifficulty}
  onDifficultyChange={handleDifficultyChange}
/>

<SubDifficultySelector
  difficulty={selectedDifficulty}
  selectedSubDifficulty={selectedSubDifficulty}
  onSubDifficultyChange={setSelectedSubDifficulty}
/>

<TopicFilter
  difficulty={selectedDifficulty}
  selectedTopic={selectedTopic}
  onTopicChange={setSelectedTopic}
/>

<button onClick={generateNewProblem}>
  Generate Problem
  {selectedTopic && ` (${selectedTopic})`}
</button>
```

#### 4. Add Topic Badges to Problem Display
**Update:** `src/pages/Problems/components/ProblemDescription.jsx`

```jsx
function TopicBadge({ topic }) {
  return (
    <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mr-2">
      {topic}
    </span>
  );
}

// In ProblemDescription component:
<div className="problem-header">
  <h2>{problem.title}</h2>
  <div className="topics-container mt-2">
    {problem.primary_topic && <TopicBadge topic={problem.primary_topic} />}
    {problem.concept_tags?.map((tag, i) => (
      <TopicBadge key={i} topic={tag} />
    ))}
  </div>
  <div className="difficulty-badge">{problem.difficulty}</div>
</div>
```

#### 5. Update Saved Problems List
**Update:** `src/pages/Problems/components/SavedProblems.jsx`

Add topic filtering to saved problems list:
```jsx
// Add filter state
const [topicFilter, setTopicFilter] = useState(null);

// Filter problems
const filteredProblems = savedProblems.filter(problem => {
  if (!topicFilter) return true;
  return problem.problem_data.primary_topic === topicFilter;
});

// Show topic in list
<div className="problem-item">
  <h3>{problem.problem_data.title}</h3>
  <span className="topic-badge">{problem.problem_data.primary_topic}</span>
  <span className="difficulty-badge">{problem.problem_data.difficulty}</span>
</div>
```

### Hook Updates

#### Update `src/hooks/useProblemGeneration.js`

```javascript
export function useProblemGeneration() {
  const generateProblem = async (difficulty, subDifficulty = null, primaryTopic = null) => {
    // ... existing code ...

    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-problem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        difficulty,
        subDifficulty,
        primaryTopic
      })
    });

    const problemData = await response.json();

    // Save to database with new fields
    await supabase
      .from('saved_problems')
      .upsert({
        title: problemData.title,
        problem_data: problemData,
        difficulty: difficulty,
        sub_difficulty: subDifficulty,
        primary_topic: problemData.primary_topic,
        secondary_topics: problemData.concept_tags || [],
        concept_tags: problemData.concept_tags || []
      }, { onConflict: 'title' });

    return problemData;
  };

  return { generateProblem };
}
```

### Migration File

**Create:** `supabase/migrations/[timestamp]_add_topic_filtering.sql`

```sql
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

-- Create index on sql_topics
CREATE INDEX IF NOT EXISTS idx_sql_topics_difficulty ON sql_topics(difficulty_tier);
CREATE INDEX IF NOT EXISTS idx_sql_topics_category ON sql_topics(category);
```

## Testing Checklist

### Backend Testing
- [ ] Generate problem with no topic specified (should work as before)
- [ ] Generate problem with specific topic (should focus on that topic)
- [ ] Generate problem with sub-difficulty (should match difficulty description)
- [ ] Generate Intermediate+ problem (should introduce ONE Advanced concept)
- [ ] Generate Advanced- problem (should be simpler than standard Advanced)
- [ ] Verify topic metadata saved correctly in database
- [ ] Test with all available topics

### Frontend Testing
- [ ] Topic filter shows correct topics for each difficulty
- [ ] Sub-difficulty selector shows correct options
- [ ] Topic badges display correctly on problems
- [ ] Saved problems can be filtered by topic
- [ ] State resets correctly when changing difficulty
- [ ] Generate button shows selected topic
- [ ] Loading states work correctly

### Integration Testing
- [ ] Complete flow: select topic → generate → solve → see topic in history
- [ ] Verify saved problems store topic metadata
- [ ] Check that problem_history records include topics
- [ ] Test edge cases (invalid topics, missing data)

### User Experience Testing
- [ ] Is it clear what each sub-difficulty means?
- [ ] Are topic names understandable?
- [ ] Does filtering feel responsive?
- [ ] Is it easy to switch between "All Topics" and specific topics?

## Success Metrics

After implementation, these outcomes should be achievable:
1. Users can generate "Intermediate+" problems that gently introduce Advanced concepts
2. Users can practice only Window Functions if they struggle with that topic
3. Problem metadata includes accurate topic information
4. UI clearly shows available topics per difficulty level
5. Smooth progression path from Intermediate → Intermediate+ → Advanced- → Advanced

## Future Enhancements (Out of Scope for This Implementation)

- Topic mastery tracking (% completion per topic)
- Recommended next topic based on history
- Topic prerequisites enforcement
- Topic-specific leaderboards
- AI-powered topic difficulty adjustment based on user performance

## Implementation Steps (Recommended Order)

1. **Database Migration** - Run migration to add columns and seed topics
2. **Backend Updates** - Update generate-problem function with topic/sub-difficulty support
3. **Frontend Components** - Build TopicFilter and SubDifficultySelector components
4. **Integration** - Wire up components to Problems.jsx and hooks
5. **UI Polish** - Add topic badges and styling
6. **Testing** - Comprehensive testing of all scenarios
7. **Documentation** - Update README with new features

## Notes

- Ensure backward compatibility - problems without topics should still work
- Topic validation should be lenient (if AI generates invalid topic, still save the problem)
- Consider caching topic list in frontend to avoid repeated queries
- Monitor AI accuracy in topic classification - may need prompt refinement
- Start with predefined topic list, can expand based on user feedback

Good luck with the implementation! Focus on making the user experience smooth and intuitive.
