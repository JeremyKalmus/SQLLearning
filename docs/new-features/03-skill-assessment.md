# Feature Implementation: Skill Assessment & Gap Analysis

## Overview
Create a comprehensive SQL skill assessment system that tests users on specific concepts, identifies weak areas, visualizes skill levels with a radar chart, and recommends personalized learning paths. This helps users understand exactly what they need to practice before jumping to Advanced levels.

## Current System Context

### Existing Features
- **User Statistics**: Total XP, level, streak, problems attempted/solved
- **Difficulty Levels**: Basic, Intermediate, Advanced, Expert
- **No Assessment**: Users self-select difficulty without guidance
- **Gap**: Users don't know which specific concepts they're weak in

### Current User Flow
```
New User → Select Difficulty → Start Solving Problems
```

**New Flow:**
```
New User → Take Assessment → View Skill Profile → Get Recommendations → Start Targeted Practice
```

## Feature Requirements

### 1. Initial Skill Assessment
A diagnostic quiz that:
- Tests 10-15 specific SQL concepts
- Takes 15-20 minutes to complete
- Includes multiple question types:
  - Multiple choice (concept understanding)
  - Query writing (hands-on skills)
  - Query reading (identify what a query does)
  - Error detection (find the bug)
- Provides immediate results with skill breakdown

### 2. Skill Categories to Assess

#### Basic Skills
- SELECT fundamentals
- WHERE clause filtering
- DISTINCT and ORDER BY
- Basic functions (LIKE, IN, BETWEEN)
- NULL handling

#### Intermediate Skills
- INNER JOINs
- LEFT/RIGHT/FULL OUTER JOINs
- GROUP BY and HAVING
- Aggregate functions (COUNT, SUM, AVG, MIN, MAX)
- Multiple table queries

#### Advanced Skills
- Window functions (ROW_NUMBER, RANK, DENSE_RANK)
- Analytical window functions (LAG, LEAD, SUM OVER)
- Common Table Expressions (CTEs)
- Subqueries (scalar, correlated, IN/EXISTS)
- Self-joins
- CASE statements
- Date/time functions

#### Expert Skills
- Recursive CTEs
- Advanced analytics
- Query optimization
- Complex nested queries

### 3. Skill Visualization
- **Radar Chart**: Visual representation of skill levels across categories
- **Skill Bars**: Individual progress bars per concept
- **Mastery Levels**: Beginner (0-40%), Intermediate (41-70%), Advanced (71-90%), Expert (91-100%)
- **Weak Spots Highlighted**: Clear visual indicators of areas needing improvement

### 4. Personalized Recommendations
Based on assessment results:
- Suggested difficulty level to start at
- Specific topics to practice
- Tutorial recommendations
- Custom problem sets
- Prerequisite concepts to master

### 5. Reassessment & Progress Tracking
- Retake assessment anytime
- Track skill improvement over time
- Show "before and after" comparisons
- Celebrate milestone achievements

## Technical Implementation

### Database Schema

#### 1. Create `skill_assessments` table
```sql
CREATE TABLE skill_assessments (
  id SERIAL PRIMARY KEY,
  assessment_name TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT DEFAULT 'comprehensive' CHECK (assessment_type IN ('comprehensive', 'quick', 'topic_specific')),
  estimated_time_minutes INTEGER,
  questions JSONB NOT NULL, -- array of question objects
  skill_weights JSONB NOT NULL, -- how questions map to skills
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Seed the main comprehensive assessment
INSERT INTO skill_assessments (assessment_name, description, estimated_time_minutes) VALUES
  ('SQL Comprehensive Assessment', 'Complete diagnostic test covering all SQL skill levels', 20);
```

#### 2. Create `assessment_questions` table
```sql
CREATE TABLE assessment_questions (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER REFERENCES skill_assessments(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'write_query', 'read_query', 'find_error', 'fill_blank')),
  question_data JSONB NOT NULL,
  skill_category TEXT NOT NULL, -- 'basic', 'intermediate', 'advanced', 'expert'
  specific_skills TEXT[] NOT NULL, -- ['JOINs', 'Window Functions']
  difficulty_weight DECIMAL DEFAULT 1.0, -- how much this question contributes to skill score
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assessment_questions_assessment ON assessment_questions(assessment_id);
CREATE INDEX idx_assessment_questions_skills ON assessment_questions USING GIN(specific_skills);
```

#### 3. Create `user_assessments` table
```sql
CREATE TABLE user_assessments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id INTEGER REFERENCES skill_assessments(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  time_spent_seconds INTEGER,
  overall_score INTEGER, -- 0-100
  skill_scores JSONB, -- { "JOINs": 85, "Window Functions": 45, ... }
  recommendations JSONB, -- personalized recommendations
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_assessments_user ON user_assessments(user_id);
CREATE INDEX idx_user_assessments_completed ON user_assessments(user_id, completed_at);

-- Enable RLS
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assessments"
  ON user_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessments"
  ON user_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments"
  ON user_assessments FOR UPDATE
  USING (auth.uid() = user_id);
```

#### 4. Create `assessment_responses` table
```sql
CREATE TABLE assessment_responses (
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

CREATE INDEX idx_assessment_responses_user_assessment ON assessment_responses(user_assessment_id);
CREATE INDEX idx_assessment_responses_user ON assessment_responses(user_id);

-- Enable RLS
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own responses"
  ON assessment_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
  ON assessment_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### 5. Create `user_skill_profiles` table
```sql
CREATE TABLE user_skill_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  skill_scores JSONB NOT NULL DEFAULT '{}', -- current skill levels
  last_assessment_id INTEGER REFERENCES user_assessments(id),
  last_assessed_at TIMESTAMP,
  recommended_level TEXT, -- 'basic', 'intermediate', 'advanced', 'expert'
  weak_skills TEXT[], -- skills below 60%
  strong_skills TEXT[], -- skills above 80%
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_skill_profiles_user ON user_skill_profiles(user_id);

-- Enable RLS
ALTER TABLE user_skill_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own skill profile"
  ON user_skill_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skill profile"
  ON user_skill_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skill profile"
  ON user_skill_profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

### Question Data Structure (JSONB)

```typescript
interface MultipleChoiceQuestion {
  type: 'multiple_choice';
  question: string;
  code?: string; // optional SQL snippet
  options: string[];
  correctAnswer: number; // index of correct option
  explanation: string;
}

interface WriteQueryQuestion {
  type: 'write_query';
  question: string;
  description: string;
  expectedResult?: any[]; // expected query output
  solutionQuery: string;
  testCases?: TestCase[]; // optional: specific scenarios to validate
}

interface TestCase {
  description: string;
  validationQuery: string;
  expectedOutput: any;
}

interface ReadQueryQuestion {
  type: 'read_query';
  question: string;
  queryToRead: string;
  options: string[]; // descriptions of what the query might do
  correctAnswer: number;
  explanation: string;
}

interface FindErrorQuestion {
  type: 'find_error';
  question: string;
  brokenQuery: string;
  errorDescription: string;
  fixedQuery: string;
  explanation: string;
}

interface FillBlankQuestion {
  type: 'fill_blank';
  question: string;
  queryTemplate: string; // "SELECT * FROM users _____ email = '[email protected]'"
  blanks: Blank[];
  explanation: string;
}

interface Blank {
  position: number;
  correctAnswer: string;
  acceptableAnswers?: string[]; // alternative correct answers
}
```

### Backend: Supabase Edge Functions

#### 1. Create `supabase/functions/get-assessment/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const { assessmentId } = await req.json();

  // Get assessment details
  const { data: assessment } = await supabase
    .from('skill_assessments')
    .select('*')
    .eq('id', assessmentId)
    .eq('is_active', true)
    .single();

  if (!assessment) {
    return new Response(JSON.stringify({ error: 'Assessment not found' }), {
      status: 404
    });
  }

  // Get all questions for this assessment
  const { data: questions } = await supabase
    .from('assessment_questions')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('question_order');

  return new Response(JSON.stringify({
    assessment,
    questions
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### 2. Create `supabase/functions/start-assessment/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const authHeader = req.headers.get('Authorization')!;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);

  const { assessmentId } = await req.json();

  // Create new user assessment record
  const { data: userAssessment, error } = await supabase
    .from('user_assessments')
    .insert({
      user_id: user.id,
      assessment_id: assessmentId,
      status: 'in_progress',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400
    });
  }

  return new Response(JSON.stringify(userAssessment), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### 3. Create `supabase/functions/submit-assessment-response/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const authHeader = req.headers.get('Authorization')!;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);

  const { userAssessmentId, questionId, response, timeSpentSeconds } = await req.json();

  // Get question details
  const { data: question } = await supabase
    .from('assessment_questions')
    .select('*')
    .eq('id', questionId)
    .single();

  let isCorrect = false;
  let score = 0;
  let feedback = '';

  // Check answer based on question type
  switch (question.question_type) {
    case 'multiple_choice':
      isCorrect = response.selectedOption === question.question_data.correctAnswer;
      score = isCorrect ? 100 : 0;
      feedback = question.question_data.explanation;
      break;

    case 'write_query':
      // Use AI to check query
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('anthropic_api_key_encrypted')
        .eq('id', user.id)
        .single();

      const apiKey = profile.anthropic_api_key_encrypted;
      const anthropic = new Anthropic({ apiKey });

      const checkResult = await checkQueryWithAI(
        anthropic,
        question.question_data,
        response.query
      );

      isCorrect = checkResult.isCorrect;
      score = checkResult.score;
      feedback = checkResult.feedback;
      break;

    case 'read_query':
      isCorrect = response.selectedOption === question.question_data.correctAnswer;
      score = isCorrect ? 100 : 0;
      feedback = question.question_data.explanation;
      break;

    case 'find_error':
      // Check if user identified the error location or provided a fix
      const fixCheck = await checkErrorFix(
        response.fixedQuery || response.errorDescription,
        question.question_data.fixedQuery,
        question.question_data.errorDescription
      );
      isCorrect = fixCheck.isCorrect;
      score = fixCheck.score;
      feedback = fixCheck.feedback;
      break;

    case 'fill_blank':
      const blankCheck = checkFillBlank(response.blanks, question.question_data.blanks);
      isCorrect = blankCheck.isCorrect;
      score = blankCheck.score;
      feedback = blankCheck.feedback;
      break;
  }

  // Save response
  await supabase.from('assessment_responses').insert({
    user_assessment_id: userAssessmentId,
    question_id: questionId,
    user_id: user.id,
    response_data: response,
    is_correct: isCorrect,
    score,
    feedback,
    time_spent_seconds: timeSpentSeconds
  });

  return new Response(JSON.stringify({
    isCorrect,
    score,
    feedback
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

async function checkQueryWithAI(anthropic, questionData, userQuery) {
  const prompt = `Check if this SQL query correctly answers the question.

Question: ${questionData.question}
Description: ${questionData.description}

Expected Solution:
${questionData.solutionQuery}

Student's Query:
${userQuery}

Evaluate:
1. Is it correct?
2. Score from 0-100
3. Feedback

Respond in JSON: {"isCorrect": boolean, "score": number, "feedback": string}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }]
  });

  return JSON.parse(message.content[0].text);
}

function checkFillBlank(userBlanks, correctBlanks) {
  let correctCount = 0;
  const feedback = [];

  correctBlanks.forEach((blank, index) => {
    const userAnswer = userBlanks[index]?.trim().toUpperCase();
    const correctAnswer = blank.correctAnswer.toUpperCase();
    const acceptable = blank.acceptableAnswers?.map(a => a.toUpperCase()) || [];

    if (userAnswer === correctAnswer || acceptable.includes(userAnswer)) {
      correctCount++;
    } else {
      feedback.push(`Blank ${index + 1}: Expected "${correctAnswer}"`);
    }
  });

  const score = Math.round((correctCount / correctBlanks.length) * 100);
  const isCorrect = score === 100;

  return {
    isCorrect,
    score,
    feedback: isCorrect ? 'All blanks correct!' : feedback.join(', ')
  };
}
```

#### 4. Create `supabase/functions/complete-assessment/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const authHeader = req.headers.get('Authorization')!;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);

  const { userAssessmentId, timeSpentSeconds } = await req.json();

  // Get all responses for this assessment
  const { data: responses } = await supabase
    .from('assessment_responses')
    .select(`
      *,
      question:assessment_questions(specific_skills, skill_category, difficulty_weight)
    `)
    .eq('user_assessment_id', userAssessmentId);

  // Calculate overall score
  const totalScore = responses.reduce((sum, r) => sum + r.score, 0);
  const overallScore = Math.round(totalScore / responses.length);

  // Calculate skill scores
  const skillScores = calculateSkillScores(responses);

  // Generate recommendations
  const recommendations = generateRecommendations(skillScores);

  // Update user assessment
  await supabase
    .from('user_assessments')
    .update({
      completed_at: new Date().toISOString(),
      status: 'completed',
      time_spent_seconds: timeSpentSeconds,
      overall_score: overallScore,
      skill_scores: skillScores,
      recommendations
    })
    .eq('id', userAssessmentId);

  // Update user skill profile
  const weakSkills = Object.entries(skillScores)
    .filter(([_, score]) => score < 60)
    .map(([skill]) => skill);

  const strongSkills = Object.entries(skillScores)
    .filter(([_, score]) => score > 80)
    .map(([skill]) => skill);

  const recommendedLevel = determineRecommendedLevel(skillScores);

  await supabase
    .from('user_skill_profiles')
    .upsert({
      user_id: user.id,
      skill_scores: skillScores,
      last_assessment_id: userAssessmentId,
      last_assessed_at: new Date().toISOString(),
      recommended_level: recommendedLevel,
      weak_skills: weakSkills,
      strong_skills: strongSkills,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  return new Response(JSON.stringify({
    overallScore,
    skillScores,
    recommendations,
    recommendedLevel,
    weakSkills,
    strongSkills
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

function calculateSkillScores(responses) {
  const skillTotals = {};
  const skillCounts = {};

  responses.forEach(response => {
    response.question.specific_skills.forEach(skill => {
      if (!skillTotals[skill]) {
        skillTotals[skill] = 0;
        skillCounts[skill] = 0;
      }
      skillTotals[skill] += response.score * response.question.difficulty_weight;
      skillCounts[skill] += response.question.difficulty_weight;
    });
  });

  const skillScores = {};
  Object.keys(skillTotals).forEach(skill => {
    skillScores[skill] = Math.round(skillTotals[skill] / skillCounts[skill]);
  });

  return skillScores;
}

function generateRecommendations(skillScores) {
  const recommendations = {
    suggestedDifficulty: '',
    topicsToFocus: [],
    tutorialsToTake: [],
    practiceProblems: []
  };

  // Identify weak areas
  const weakSkills = Object.entries(skillScores)
    .filter(([_, score]) => score < 60)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);

  recommendations.topicsToFocus = weakSkills.map(([skill]) => skill);

  // Map skills to tutorials
  const tutorialMapping = {
    'Window Functions': 'intro-to-window-functions',
    'CTEs': 'common-table-expressions',
    'Subqueries': 'subqueries-fundamentals',
    'Self-Joins': 'self-joins-explained',
    'JOINs': 'mastering-joins'
  };

  recommendations.tutorialsToTake = weakSkills
    .map(([skill]) => tutorialMapping[skill])
    .filter(Boolean);

  return recommendations;
}

function determineRecommendedLevel(skillScores) {
  const avgBasic = getAvgForCategory(skillScores, ['SELECT', 'WHERE', 'ORDER BY']);
  const avgIntermediate = getAvgForCategory(skillScores, ['JOINs', 'Aggregates', 'GROUP BY']);
  const avgAdvanced = getAvgForCategory(skillScores, ['Window Functions', 'CTEs', 'Subqueries']);

  if (avgAdvanced > 70) return 'advanced';
  if (avgIntermediate > 70) return 'intermediate+';
  if (avgIntermediate > 40) return 'intermediate';
  return 'basic';
}

function getAvgForCategory(skillScores, skills) {
  const scores = skills.map(s => skillScores[s] || 0).filter(s => s > 0);
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}
```

### Frontend Implementation

#### 1. Create Assessment Landing Page: `src/pages/Assessment.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Assessment() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [lastAssessment, setLastAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAssessmentHistory();
  }, []);

  const checkAssessmentHistory = async () => {
    const { data } = await supabase
      .from('user_assessments')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setHasCompletedAssessment(true);
      setLastAssessment(data[0]);
    }

    setLoading(false);
  };

  const startAssessment = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/start-assessment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ assessmentId: 1 }) // main comprehensive assessment
      }
    );

    const userAssessment = await response.json();
    navigate(`/assessment/take/${userAssessment.id}`);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="assessment-page max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">SQL Skill Assessment</h1>
        <p className="text-gray-600 text-lg">
          Discover your SQL strengths and identify areas for improvement
        </p>
      </header>

      <div className="assessment-card bg-white border rounded-lg p-8 shadow-sm">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="feature">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold mb-1">Comprehensive Analysis</h3>
            <p className="text-sm text-gray-600">
              Test 15+ SQL concepts from basic to expert
            </p>
          </div>

          <div className="feature">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold mb-1">Personalized Insights</h3>
            <p className="text-sm text-gray-600">
              Get tailored recommendations for your learning path
            </p>
          </div>

          <div className="feature">
            <div className="text-3xl mb-2">📈</div>
            <h3 className="font-semibold mb-1">Visual Progress</h3>
            <p className="text-sm text-gray-600">
              See your skills visualized in an interactive radar chart
            </p>
          </div>

          <div className="feature">
            <div className="text-3xl mb-2">⏱️</div>
            <h3 className="font-semibold mb-1">20 Minutes</h3>
            <p className="text-sm text-gray-600">
              Complete assessment with immediate results
            </p>
          </div>
        </div>

        {hasCompletedAssessment && (
          <div className="previous-assessment bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-700 mb-2">
              Last assessment: {new Date(lastAssessment.completed_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-700">
              Overall Score: <strong>{lastAssessment.overall_score}/100</strong>
            </p>
            <button
              onClick={() => navigate(`/assessment/results/${lastAssessment.id}`)}
              className="text-blue-600 text-sm mt-2 hover:underline"
            >
              View Previous Results →
            </button>
          </div>
        )}

        <button
          onClick={startAssessment}
          className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          {hasCompletedAssessment ? 'Retake Assessment' : 'Start Assessment'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your progress is saved automatically. You can pause and resume anytime.
        </p>
      </div>
    </div>
  );
}
```

#### 2. Create Assessment Taking Page: `src/pages/AssessmentTake.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import QuestionRenderer from './Assessment/components/QuestionRenderer';
import ProgressBar from './Assessment/components/ProgressBar';

export default function AssessmentTake() {
  const { userAssessmentId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    fetchAssessment();
  }, []);

  const fetchAssessment = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-assessment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ assessmentId: 1 })
      }
    );

    const data = await response.json();
    setQuestions(data.questions);
    setLoading(false);
  };

  const handleResponseSubmit = async (questionId, response, timeSpent) => {
    const result = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-assessment-response`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userAssessmentId,
          questionId,
          response,
          timeSpentSeconds: timeSpent
        })
      }
    );

    const feedback = await result.json();

    setResponses(prev => ({
      ...prev,
      [questionId]: { response, feedback }
    }));

    // Move to next question after brief delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        completeAssessment();
      }
    }, 2000);
  };

  const completeAssessment = async () => {
    const totalTime = Math.floor((Date.now() - startTime) / 1000);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complete-assessment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userAssessmentId,
          timeSpentSeconds: totalTime
        })
      }
    );

    const results = await response.json();
    navigate(`/assessment/results/${userAssessmentId}`);
  };

  if (loading) return <div>Loading assessment...</div>;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="assessment-take max-w-4xl mx-auto px-4 py-8">
      <ProgressBar
        current={currentQuestionIndex + 1}
        total={questions.length}
      />

      <div className="question-container mt-8">
        <QuestionRenderer
          question={currentQuestion}
          onSubmit={(response, timeSpent) =>
            handleResponseSubmit(currentQuestion.id, response, timeSpent)
          }
          feedback={responses[currentQuestion.id]?.feedback}
        />
      </div>

      <div className="navigation-hint text-center mt-6 text-sm text-gray-500">
        Question {currentQuestionIndex + 1} of {questions.length}
      </div>
    </div>
  );
}
```

#### 3. Create Results Page with Radar Chart: `src/pages/AssessmentResults.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function AssessmentResults() {
  const { userAssessmentId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    const { data } = await supabase
      .from('user_assessments')
      .select('*')
      .eq('id', userAssessmentId)
      .single();

    setResults(data);
    setLoading(false);
  };

  if (loading) return <div>Loading results...</div>;

  const skillScores = results.skill_scores;
  const skills = Object.keys(skillScores);
  const scores = Object.values(skillScores);

  const radarData = {
    labels: skills,
    datasets: [
      {
        label: 'Your Skill Level',
        data: scores,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)'
      }
    ]
  };

  const radarOptions = {
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  return (
    <div className="assessment-results max-w-6xl mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Your SQL Skill Profile</h1>
        <div className="overall-score text-5xl font-bold text-blue-600 my-4">
          {results.overall_score}/100
        </div>
        <p className="text-gray-600">
          Recommended Level: <strong className="text-blue-600">{results.recommended_level}</strong>
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="radar-chart bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Skills Overview</h2>
          <Radar data={radarData} options={radarOptions} />
        </div>

        <div className="skill-breakdown bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Detailed Scores</h2>
          <div className="space-y-3">
            {Object.entries(skillScores)
              .sort((a, b) => b[1] - a[1])
              .map(([skill, score]) => (
                <div key={skill} className="skill-bar-item">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{skill}</span>
                    <span className="text-sm text-gray-600">{score}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getScoreColor(score)}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="recommendations bg-white p-6 rounded-lg border mb-8">
        <h2 className="text-2xl font-semibold mb-4">Personalized Recommendations</h2>

        {results.recommendations.topicsToFocus.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Focus on these topics:</h3>
            <div className="flex flex-wrap gap-2">
              {results.recommendations.topicsToFocus.map(topic => (
                <span key={topic} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {results.recommendations.tutorialsToTake.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Recommended Tutorials:</h3>
            <ul className="space-y-2">
              {results.recommendations.tutorialsToTake.map(tutorial => (
                <li key={tutorial}>
                  <button
                    onClick={() => navigate(`/learn/${tutorial}`)}
                    className="text-blue-600 hover:underline"
                  >
                    {formatTutorialName(tutorial)} →
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2">Start Practicing:</h3>
          <button
            onClick={() => navigate(`/problems?difficulty=${results.recommended_level}`)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Practice {results.recommended_level} Problems
          </button>
        </div>
      </div>

      <div className="actions text-center">
        <button
          onClick={() => navigate('/assessment')}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50 mr-3"
        >
          Retake Assessment
        </button>
        <button
          onClick={() => navigate('/problems')}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Start Practicing
        </button>
      </div>
    </div>
  );
}

function getScoreColor(score) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function formatTutorialName(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
```

#### 4. Install Chart.js dependency

```bash
npm install react-chartjs-2 chart.js
```

### Seed Assessment Questions

Create script: `scripts/seed-assessment-questions.js`

```javascript
const questions = [
  {
    assessment_id: 1,
    question_order: 1,
    question_type: 'multiple_choice',
    skill_category: 'basic',
    specific_skills: ['SELECT', 'WHERE'],
    difficulty_weight: 1.0,
    question_data: {
      question: 'Which SQL clause filters rows before any grouping occurs?',
      options: ['HAVING', 'WHERE', 'GROUP BY', 'ORDER BY'],
      correctAnswer: 1,
      explanation: 'WHERE filters rows before grouping. HAVING filters after grouping.'
    }
  },
  {
    assessment_id: 1,
    question_order: 2,
    question_type: 'write_query',
    skill_category: 'intermediate',
    specific_skills: ['JOINs', 'Aggregates'],
    difficulty_weight: 1.5,
    question_data: {
      question: 'Find customers and their total order amounts',
      description: 'Write a query that shows each customer\'s name and their total order amount. Include customers with no orders (show NULL or 0).',
      solutionQuery: `SELECT c.name, COALESCE(SUM(o.total_amount), 0) as total_orders
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.name;`
    }
  },
  // Add 13 more questions covering all skills...
];

// Insert into database
```

## Testing Checklist

### Backend Testing
- [ ] Assessment creation and retrieval
- [ ] User assessment start/resume/complete flow
- [ ] Response submission for all question types
- [ ] AI evaluation for write_query questions
- [ ] Skill score calculation accuracy
- [ ] Recommendation generation logic
- [ ] RLS policies enforce user isolation

### Frontend Testing
- [ ] Assessment landing page displays correctly
- [ ] Question navigation works smoothly
- [ ] All question types render properly
- [ ] Response submission provides immediate feedback
- [ ] Progress bar updates correctly
- [ ] Results page shows radar chart
- [ ] Skill breakdown displays all skills
- [ ] Recommendations link to correct pages

### Integration Testing
- [ ] Complete assessment flow end-to-end
- [ ] Skill profile updates after completion
- [ ] Retake assessment shows previous results
- [ ] Recommendations navigate to actual content
- [ ] Time tracking works accurately

## Success Metrics

1. Users complete assessment and see personalized skill profile
2. Radar chart accurately visualizes skill levels
3. Weak skills clearly identified
4. Recommendations lead to relevant tutorials/problems
5. Users can track improvement over time

## Implementation Timeline

**Week 1:** Database schema, question seeding, backend functions
**Week 2:** Frontend pages (landing, taking, results)
**Week 3:** Radar chart visualization, recommendations system
**Week 4:** Testing, polish, additional questions

Good luck building this powerful assessment system!
