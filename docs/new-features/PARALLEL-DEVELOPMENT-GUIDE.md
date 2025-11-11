# Parallel Development Guide - Three Agents

This guide explains how to run all three feature agents in parallel without conflicts.

## 🎯 Quick Start

### Step 1: Run Foundation Migration (5 minutes)
```bash
# Navigate to Supabase migrations folder
cd supabase/migrations

# Copy the foundation migration
cp ../../docs/new-features/00-foundation-migration.sql ./20250111120000_new_features_foundation.sql

# Apply migration
supabase db push

# Verify
supabase db reset  # if needed to test fresh
```

This migration establishes:
- ✅ `sql_topics` table with canonical skill taxonomy
- ✅ Topic/sub-difficulty columns in existing tables
- ✅ Helper functions for topic validation
- ✅ Indexes for efficient filtering

---

### Step 2: Launch Three Agents Simultaneously

#### Agent 1: Topic-Based Filtering
**Prompt:** `docs/new-features/01-topic-based-filtering-sub-difficulties.md`

**Instructions to add:**
```
IMPORTANT: The foundation migration has already been run. The following are already created:
- sql_topics table (with 18 seeded topics)
- Columns in saved_problems: sub_difficulty, primary_topic, secondary_topics, concept_tags
- Columns in problem_history: sub_difficulty, primary_topic
- Indexes: idx_saved_problems_sub_difficulty, idx_saved_problems_primary_topic, idx_saved_problems_difficulty_topic

Your tasks:
1. SKIP the database migration section (already done)
2. Focus on backend: Update supabase/functions/generate-problem/index.ts to accept and use topic/sub-difficulty
3. Focus on frontend: Create TopicFilter.jsx and SubDifficultySelector.jsx components
4. Update Problems.jsx to integrate new filters
5. Update useProblemGeneration.js hook
6. Test the complete flow

Migration naming: If you need any additional database changes, name them:
20250111_120001_topic_filtering_additional.sql
```

---

#### Agent 2: Interactive Tutorials
**Prompt:** `docs/new-features/02-interactive-concept-tutorials.md`

**Instructions to add:**
```
IMPORTANT: The foundation migration has already been run. The sql_topics table exists with canonical topic names.

When creating tutorials, reference topics using the exact names from sql_topics:
- "Window Functions" (not "window functions" or "Window functions")
- "CTEs" (not "Common Table Expressions" in the topic field)
- "Subqueries", "Self-Joins", "CASE Statements", etc.

Your tasks:
1. Create database migration: 20250111_120002_create_tutorials.sql
   - Tables: tutorials, tutorial_progress, micro_challenges, challenge_submissions
   - Reference sql_topics.topic_name for tutorial.topic field
2. Create Supabase Edge Functions:
   - get-tutorials
   - check-micro-challenge
3. Create frontend pages:
   - Learn.jsx (tutorial list)
   - TutorialView.jsx (tutorial player)
   - All components in Learn/components/
4. Seed 2-3 initial tutorials (Window Functions, CTEs, Subqueries)
5. Test complete tutorial flow

Note: You will not conflict with Agent 1 or Agent 3 - your tables are completely separate.
```

---

#### Agent 3: Skill Assessment
**Prompt:** `docs/new-features/03-skill-assessment.md`

**Instructions to add:**
```
IMPORTANT: The foundation migration has already been run. The sql_topics table exists with canonical topic names.

When storing skill scores, use topic_name from sql_topics as keys in JSONB:
{
  "Window Functions": 85,
  "CTEs": 65,
  "Subqueries": 70
}

Your tasks:
1. Create database migration: 20250111_120003_create_assessments.sql
   - Tables: skill_assessments, assessment_questions, user_assessments, assessment_responses, user_skill_profiles
   - Use sql_topics for skill names in assessment_questions.specific_skills[]
2. Create Supabase Edge Functions:
   - get-assessment
   - start-assessment
   - submit-assessment-response
   - complete-assessment
3. Create frontend pages:
   - Assessment.jsx (landing)
   - AssessmentTake.jsx (taking assessment)
   - AssessmentResults.jsx (results with radar chart)
4. Seed 15 assessment questions covering all skill levels
5. Install react-chartjs-2 and chart.js dependencies
6. Test complete assessment flow

Note: You will not conflict with Agent 1 or Agent 2 - your tables are completely separate.
```

---

## 📋 Coordination Checklist

### Before Starting
- [ ] Foundation migration applied to database
- [ ] `sql_topics` table has 18 rows
- [ ] `saved_problems` and `problem_history` have new columns
- [ ] All three agents have updated instructions (see above)
- [ ] Migration naming convention agreed upon

### During Development
- [ ] Agents use consistent topic names from `sql_topics` table
- [ ] Agents create uniquely named migrations (120001, 120002, 120003)
- [ ] Agents reference shared documentation for topic list
- [ ] No agent modifies tables owned by another agent

### After Development
- [ ] All three migrations applied successfully
- [ ] No migration conflicts or errors
- [ ] Shared topic names consistent across features
- [ ] Cross-feature links work (Assessment → Tutorials → Problems)

---

## 🗄️ Database Ownership

### Agent 1 (Topic Filtering)
**Owns:**
- Modifications to: `saved_problems`, `problem_history`
- Table: `sql_topics` (already created, just references it)

**Does NOT touch:**
- Any tables created by Agent 2 or 3

---

### Agent 2 (Tutorials)
**Owns:**
- Tables: `tutorials`, `tutorial_progress`, `micro_challenges`, `challenge_submissions`
- Edge Functions: `get-tutorials`, `check-micro-challenge`

**Does NOT touch:**
- `saved_problems`, `problem_history` (Agent 1)
- Assessment tables (Agent 3)

---

### Agent 3 (Assessment)
**Owns:**
- Tables: `skill_assessments`, `assessment_questions`, `user_assessments`, `assessment_responses`, `user_skill_profiles`
- Edge Functions: `get-assessment`, `start-assessment`, `submit-assessment-response`, `complete-assessment`

**Does NOT touch:**
- `saved_problems`, `problem_history` (Agent 1)
- Tutorial tables (Agent 2)

---

## 🔗 Integration Points

These will be connected AFTER all three features are built:

### Assessment → Tutorials
**Location:** `AssessmentResults.jsx`
```jsx
// Link to tutorials from recommendations
<Link to={`/learn/${tutorialSlug}`}>
  Take "Introduction to Window Functions" tutorial →
</Link>
```

**Requirement:** Agent 2 must create tutorial with matching slug

---

### Tutorials → Problems
**Location:** `TutorialView.jsx` (completion screen)
```jsx
// Link to practice after completing tutorial
<Link to={`/problems?difficulty=advanced-&topic=${tutorial.topic}`}>
  Practice {tutorial.topic} problems →
</Link>
```

**Requirement:** Agent 1 must support topic query parameter

---

### Problems → Assessment
**Location:** `Problems.jsx` (suggestion after N problems)
```jsx
// Suggest reassessment after progress
{problemsSolved > 10 && (
  <Link to="/assessment">
    Ready to reassess your skills? →
  </Link>
)}
```

**Requirement:** Agent 3 assessment page exists

---

## 🧪 Testing Strategy

### Individual Feature Testing (Parallel)
Each agent tests their feature independently:

**Agent 1:** Generate problems with topic filters, verify correct topic in response
**Agent 2:** Complete a tutorial, verify micro-challenges work
**Agent 3:** Take assessment, verify radar chart displays

### Integration Testing (After All Complete)
Once all features are deployed:

1. **Full User Journey:**
   - Take assessment → View results → Click tutorial link → Complete tutorial → Practice filtered problems

2. **Cross-Feature Data Flow:**
   - Verify topic names match across all features
   - Verify links navigate correctly
   - Verify progress tracked consistently

3. **Shared Taxonomy:**
   - Query `sql_topics` and verify all features use same names
   - Test all topic references are valid

---

## 🚨 Conflict Resolution

### If migrations have same timestamp:
```bash
# Rename migrations with sequential timestamps
mv 20250111120000_create_tutorials.sql 20250111120002_create_tutorials.sql
mv 20250111120000_create_assessments.sql 20250111120003_create_assessments.sql
```

### If topic names don't match:
Update code to use canonical names from `sql_topics`:
```sql
-- Check canonical names
SELECT topic_name FROM sql_topics ORDER BY id;

-- Update any hardcoded references to match
```

### If tables conflict:
This shouldn't happen if agents follow ownership rules. If it does:
1. Identify which agent owns the table
2. Have other agent reference it via foreign key instead of recreating
3. Add RLS policies if needed for cross-feature access

---

## 📊 Progress Tracking

### Week 1: Setup & Individual Development
- [x] Foundation migration applied
- [ ] Agent 1: Backend topic filtering working
- [ ] Agent 2: Tutorial infrastructure created
- [ ] Agent 3: Assessment database schema created

### Week 2: Feature Completion
- [ ] Agent 1: UI components complete, end-to-end testing passed
- [ ] Agent 2: 2-3 tutorials seeded, micro-challenges working
- [ ] Agent 3: Radar chart displaying, recommendations generated

### Week 3: Integration & Testing
- [ ] All migrations applied to production
- [ ] Cross-feature links implemented
- [ ] Integration testing completed
- [ ] User acceptance testing

### Week 4: Polish & Launch
- [ ] Bug fixes from testing
- [ ] Documentation updated
- [ ] Launch announcement prepared
- [ ] Monitoring/analytics set up

---

## ✅ Success Criteria

### Individual Features
- [ ] **Feature 1:** Can generate "Advanced- Window Functions" problem successfully
- [ ] **Feature 2:** Can complete "Introduction to CTEs" tutorial and pass all micro-challenges
- [ ] **Feature 3:** Can take full assessment and see radar chart with recommendations

### Integration
- [ ] Assessment results page links to correct tutorials
- [ ] Tutorial completion links to filtered problems
- [ ] All features use consistent topic names
- [ ] No database conflicts or migration errors

### User Experience
- [ ] User can complete full journey: Assessment → Learn → Practice
- [ ] Navigation between features is intuitive
- [ ] Topic names are consistent across all pages
- [ ] Progress tracked accurately across all features

---

## 🎉 Launch Readiness

When all checkboxes above are complete:

1. **Merge to main branch**
2. **Deploy to production** (Supabase migrations + frontend)
3. **Monitor for errors** (check Supabase logs, Sentry, etc.)
4. **Announce to users** (in-app banner, email, social media)
5. **Gather feedback** (surveys, support tickets, analytics)
6. **Iterate** based on user feedback

---

## 📞 Communication

### Daily Standups (Optional)
If agents are humans, consider quick daily syncs:
- What did you complete yesterday?
- What are you working on today?
- Any blockers or conflicts?

### Shared Documentation
- Update this guide if you discover conflicts
- Document any schema changes not in original plans
- Share testing results and edge cases

### Code Reviews
- Each agent reviews the others' migrations before applying
- Verify no table ownership violations
- Check for consistent naming conventions

---

## 🎯 Final Notes

**Key Success Factors:**
1. ✅ Foundation migration applied FIRST
2. ✅ Each agent owns distinct tables
3. ✅ All use canonical topic names from `sql_topics`
4. ✅ Migrations uniquely named
5. ✅ Integration happens AFTER features complete

**If you follow this guide, parallel development should be smooth with zero conflicts!**

Good luck! 🚀
