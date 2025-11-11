# New Features - Implementation Prompts

This folder contains comprehensive implementation prompts for three interconnected features designed to bridge the Intermediate→Advanced SQL learning gap.

## 🚀 Quick Start for Parallel Development

### Step 1: Run Foundation Migration (You - 5 min)
```bash
cd supabase/migrations
cp ../../docs/new-features/00-foundation-migration.sql ./20250111120000_new_features_foundation.sql
supabase db push
```

### Step 2: Launch Three Agents with Their Prompts

| Agent | Prompt File | Focus | Time |
|-------|-------------|-------|------|
| **Agent 1** | `01-topic-based-filtering-sub-difficulties.md` | Topic filtering & sub-difficulties | 1-2 weeks |
| **Agent 2** | `02-interactive-concept-tutorials.md` | Learn section with tutorials | 2-3 weeks |
| **Agent 3** | `03-skill-assessment.md` | Assessment with radar charts | 2 weeks |

**Important:** Give each agent the additional instructions from `PARALLEL-DEVELOPMENT-GUIDE.md` section for their agent number.

---

## 📁 Files in This Folder

### Core Prompts (Give to Agents)
- **`01-topic-based-filtering-sub-difficulties.md`** (4,200 words)
  - Granular difficulty levels (Intermediate+, Advanced-, etc.)
  - Topic filtering (Window Functions, CTEs, etc.)
  - Enhanced problem generation

- **`02-interactive-concept-tutorials.md`** (6,500 words)
  - New "Learn" section
  - Interactive tutorials with code sandboxes
  - Micro-challenges (3-5 per tutorial)

- **`03-skill-assessment.md`** (8,000 words)
  - 15-question diagnostic assessment
  - Radar chart visualization
  - Personalized recommendations

### Supporting Documents
- **`00-overview.md`** (7,800 words)
  - How all three features work together
  - Implementation strategy
  - Success metrics

- **`00-foundation-migration.sql`**
  - Shared database schema
  - Run BEFORE starting agents
  - Establishes canonical topic taxonomy

- **`PARALLEL-DEVELOPMENT-GUIDE.md`**
  - Coordination instructions for 3 agents
  - Conflict avoidance strategies
  - Integration points

- **`README.md`** (this file)
  - Quick reference guide

---

## 🗄️ Database Ownership (No Conflicts!)

```
Agent 1 owns:
  - Modifications to: saved_problems, problem_history
  - References: sql_topics (read-only)

Agent 2 owns:
  - New tables: tutorials, tutorial_progress, micro_challenges, challenge_submissions
  - References: sql_topics (read-only)

Agent 3 owns:
  - New tables: skill_assessments, assessment_questions, user_assessments,
                assessment_responses, user_skill_profiles
  - References: sql_topics (read-only)
```

**Zero overlaps = Zero conflicts!**

---

## 🎯 What Each Feature Delivers

### Feature 1: Topic-Based Filtering
**User can now:**
- Generate "Intermediate+" problems (bridge difficulty)
- Filter problems by topic: "Window Functions only"
- See topic badges on problems
- Practice specific weak areas

**Technical:**
- Sub-difficulty system (Intermediate+, Advanced-, Advanced+)
- 18 defined SQL topics
- Enhanced AI prompt for topic targeting
- New UI filters on Problems page

---

### Feature 2: Interactive Tutorials
**User can now:**
- Take structured tutorials on SQL concepts
- Learn through executable examples
- Practice with micro-challenges
- Track tutorial completion

**Technical:**
- New /learn and /learn/:slug routes
- Tutorial content stored as JSONB
- Micro-challenge validation system
- CodeMirror integration for interactive coding
- 8 priority tutorials (Window Functions, CTEs, Subqueries, etc.)

---

### Feature 3: Skill Assessment
**User can now:**
- Take 15-question diagnostic quiz
- See skill levels in radar chart
- Get personalized recommendations
- Track improvement over time

**Technical:**
- 5 question types (multiple choice, write query, etc.)
- AI-powered answer checking
- Radar chart with Chart.js
- Skill score calculation engine
- Recommendation system linking to tutorials/problems

---

## 🔗 How They Work Together

```
User Journey:

1. ASSESSMENT (Feature 3)
   "Take diagnostic quiz"
   ↓
   Results: "Window Functions: 30%, CTEs: 45%, JOINs: 85%"

2. LEARN (Feature 2)
   "Complete 'Introduction to Window Functions' tutorial"
   ↓
   Tutorial with 5 micro-challenges completed

3. PRACTICE (Feature 1)
   "Generate Advanced- Window Functions problems"
   ↓
   Solve 10 focused problems

4. REASSESS (Feature 3)
   "Retake assessment"
   ↓
   Results: "Window Functions: 75% (+45%!)"
```

---

## ⏱️ Timeline

### Week 1: Foundation + Individual Development
- Run foundation migration
- Each agent starts their feature
- Independent development

### Week 2: Feature Completion
- Agent 1: Complete topic filtering
- Agent 2: Complete tutorial infrastructure + 2-3 tutorials
- Agent 3: Complete assessment system

### Week 3: Integration
- Connect features (links between pages)
- Integration testing
- Bug fixes

### Week 4: Polish & Launch
- User testing
- Final tweaks
- Deploy to production

---

## 📊 Success Metrics

### Immediate Wins (Week 1)
- [x] Foundation migration applied successfully
- [ ] All 3 agents running without conflicts
- [ ] Individual features testable independently

### Feature Completion (Week 2-3)
- [ ] Can generate "Advanced- Window Functions" problems
- [ ] Can complete a tutorial with micro-challenges
- [ ] Can take assessment and see radar chart

### Integration (Week 3-4)
- [ ] Assessment → Tutorial → Practice flow works end-to-end
- [ ] All topic names consistent across features
- [ ] User can track progress across all features

### User Impact (Post-Launch)
- [ ] 40%+ of problems use topic filter
- [ ] 60%+ tutorial completion rate
- [ ] 70%+ of users complete assessment
- [ ] User feedback: "The gap feels much smaller"

---

## 🚨 Common Pitfalls to Avoid

### ❌ Don't:
- Modify tables owned by another agent
- Create migrations with same timestamp
- Hardcode topic names (use sql_topics table)
- Skip the foundation migration
- Work on integration before features complete

### ✅ Do:
- Run foundation migration FIRST
- Use unique migration timestamps (120001, 120002, 120003)
- Reference sql_topics for canonical topic names
- Test your feature independently
- Document any deviations from the plan

---

## 🆘 Troubleshooting

### "Migration conflicts with existing table"
→ Check if foundation migration was applied. Run:
```sql
SELECT * FROM sql_topics;
```
Should return 18 rows.

### "Topic name not found"
→ Use exact names from sql_topics:
```sql
SELECT topic_name FROM sql_topics ORDER BY id;
```

### "Another agent modified my table"
→ Check `PARALLEL-DEVELOPMENT-GUIDE.md` for ownership rules.
→ Agents should never touch each other's tables.

### "Integration links broken"
→ This is normal during development. Fix in Week 3 integration phase.

---

## 📞 Questions?

1. **Read the overview:** `00-overview.md`
2. **Check coordination guide:** `PARALLEL-DEVELOPMENT-GUIDE.md`
3. **Review your agent's prompt:** `01-*.md`, `02-*.md`, or `03-*.md`
4. **Check foundation migration:** `00-foundation-migration.sql`

If still stuck, review the database ownership section and verify the foundation migration is applied.

---

## 🎉 Ready to Start?

1. ✅ Apply foundation migration
2. ✅ Give each agent their prompt + coordination instructions
3. ✅ Launch all 3 agents in parallel
4. ✅ Check progress weekly
5. ✅ Integrate in Week 3
6. ✅ Launch in Week 4

**You've got this!** 🚀

---

## 📋 Agent Checklist

### Before Starting
- [ ] I've read my prompt file thoroughly
- [ ] I've read the coordination instructions for my agent
- [ ] I've verified the foundation migration is applied
- [ ] I understand which tables I own
- [ ] I know the migration naming convention (12000X)

### During Development
- [ ] I'm using topic names from sql_topics table
- [ ] I'm not touching tables owned by other agents
- [ ] I'm testing my feature independently
- [ ] I'm documenting any changes to the plan

### After Completion
- [ ] My migration applied successfully
- [ ] My feature works end-to-end
- [ ] I've tested with sample data
- [ ] I'm ready for integration phase
- [ ] I've noted any integration requirements

---

**Last Updated:** 2025-01-11
**Version:** 1.0
