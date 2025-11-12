# Refactoring Plan - Large Files & Architecture
## SQL Learning Game Application

**Date:** 2025-11-11
**Status:** Proposed
**Estimated Effort:** 4-6 weeks (can run in parallel with mobile improvements)

---

## Executive Summary

The codebase has accumulated significant technical debt with several very large files that hurt maintainability, performance, and developer experience. This plan addresses the most critical refactoring needs before implementing mobile improvements.

### Large Files Identified:

| File | Size | Lines | Issue |
|------|------|-------|-------|
| `src/styles/index.css` | 90K | 4,674 | Monolithic CSS, no code-splitting |
| `src/components/CheatSheetSlider.jsx` | 24K | 757 | 18 hardcoded content sections in JSX |
| `src/pages/Flashcards.jsx` | 22K | 672 | 24 useState hooks, overly complex |
| `src/pages/Problems.jsx` | 13K | 392 | Complex orchestration, many hooks |
| `src/components/Assessment/QuestionRenderer.jsx` | 13K | 364 | Multiple question types in one file |
| `src/pages/Problems/components/SubmissionHistoryModal.jsx` | 11K | 250 | Complex modal with embedded logic |

**Total Technical Debt:** ~150K of code needing refactoring

---

## Priority 1: Critical Refactoring (Week 1-2)

### 1.1 Split Monolithic CSS File (90K → ~15-20K)

**Current State:**
- Single 4,674-line CSS file
- All styles loaded on every page
- No component-scoped styles
- Hard to maintain mobile-specific styles
- Impossible to tree-shake unused CSS

**Target Architecture:**

```
src/styles/
├── base/
│   ├── reset.css              # CSS reset/normalize (~100 lines)
│   ├── variables.css          # CSS custom properties (~80 lines)
│   └── typography.css         # Font styles (~150 lines)
├── layout/
│   ├── grid.css              # Grid utilities (~100 lines)
│   ├── container.css         # Container styles (~50 lines)
│   └── spacing.css           # Spacing utilities (~80 lines)
├── components/
│   ├── buttons.css           # Button styles (~200 lines)
│   ├── cards.css             # Card styles (~150 lines)
│   ├── modals.css            # Modal styles (~200 lines)
│   ├── forms.css             # Form styles (~180 lines)
│   └── navigation.css        # Nav/header styles (~150 lines)
├── pages/
│   ├── home.css              # Home page specific (~200 lines)
│   ├── problems.css          # Problems page specific (~800 lines)
│   ├── flashcards.css        # Flashcards specific (~300 lines)
│   ├── assessment.css        # Assessment specific (~400 lines)
│   └── learn.css             # Learn page specific (~300 lines)
└── index.css                 # Main entry, imports others (~50 lines)
```

**Implementation Steps:**

1. **Phase 1: Extract Base Styles**
   ```css
   /* src/styles/base/variables.css */
   :root {
     --primary-color: #6366f1;
     --primary-hover: #4f46e5;
     /* ... all CSS variables */
   }
   ```

2. **Phase 2: Extract Component Styles**
   ```css
   /* src/styles/components/buttons.css */
   .btn { /* ... */ }
   .btn-primary { /* ... */ }
   .btn-secondary { /* ... */ }
   /* etc */
   ```

3. **Phase 3: Extract Page-Specific Styles**
   ```css
   /* src/styles/pages/problems.css */
   .problems-page { /* ... */ }
   .problem-workspace { /* ... */ }
   .workspace-row { /* ... */ }
   ```

4. **Phase 4: Update Imports**
   ```css
   /* src/styles/index.css */
   @import './base/reset.css';
   @import './base/variables.css';
   @import './base/typography.css';
   @import './layout/grid.css';
   @import './components/buttons.css';
   @import './components/cards.css';
   /* ... */
   ```

5. **Phase 5 (Future): Migrate to CSS Modules**
   ```jsx
   // Component-scoped styles
   import styles from './Button.module.css';

   <button className={styles.primary}>Click</button>
   ```

**Benefits:**
- ✅ Code organization and maintainability
- ✅ Easier to find and modify styles
- ✅ Foundation for code-splitting CSS
- ✅ Clearer mobile-specific style files
- ✅ Easier collaboration (less merge conflicts)

**Estimated Time:** 8-12 hours

---

### 1.2 Extract CheatSheet Content to Data File (757 lines → ~100 lines)

**Current State:**
- 18 sections of SQL reference content hardcoded in JSX (lines 30-750)
- ~24K file with mostly static content
- Impossible to update without editing component
- No separation of content from presentation

**Target Architecture:**

```
src/data/
├── cheatsheet/
│   ├── index.js              # Export all sections
│   ├── basics.js             # Basic queries
│   ├── filtering.js          # WHERE, LIKE, etc.
│   ├── joins.js              # JOIN types
│   ├── aggregates.js         # GROUP BY, aggregates
│   ├── subqueries.js         # Subquery patterns
│   ├── window-functions.js   # Window functions
│   └── advanced.js           # CTEs, recursive, etc.
```

**Implementation:**

```javascript
// src/data/cheatsheet/basics.js
export const basicsSection = {
  id: 'basics',
  title: 'Basic Query Structure',
  searchTerms: ['select', 'from', 'basic', 'query'],
  content: {
    simpleSelect: {
      title: 'Simple SELECT',
      code: `SELECT column1, column2, column3
FROM table_name;`,
      description: 'Retrieve specific columns from a table'
    },
    selectWithAlias: {
      title: 'SELECT with Alias',
      code: `SELECT
    column1 AS alias1,
    column2 AS "Alias With Spaces"
FROM table_name AS t;`,
      description: 'Use aliases to rename columns or tables'
    },
    // ...
  }
};

// src/data/cheatsheet/index.js
import { basicsSection } from './basics';
import { filteringSection } from './filtering';
import { joinsSection } from './joins';
// ... import all sections

export const cheatSheetSections = [
  basicsSection,
  filteringSection,
  joinsSection,
  // ...
];
```

**Refactored Component:**

```jsx
// src/components/CheatSheetSlider.jsx (now ~100 lines)
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { cheatSheetSections } from '../data/cheatsheet';
import CheatSheetSection from './CheatSheet/CheatSheetSection';

export default function CheatSheetSlider({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter sections based on search
  const filteredSections = cheatSheetSections.filter(section => {
    const searchLower = searchTerm.toLowerCase();
    return (
      section.title.toLowerCase().includes(searchLower) ||
      section.searchTerms.some(term => term.includes(searchLower)) ||
      JSON.stringify(section.content).toLowerCase().includes(searchLower)
    );
  });

  // ... event handlers, effects

  return (
    <>
      {isOpen && <div className="cheatsheet-backdrop" onClick={onClose} />}
      <div className={`cheatsheet-slider ${isOpen ? 'open' : ''}`}>
        {/* header, search input */}
        <div className="cheatsheet-content">
          {filteredSections.length > 0 ? (
            filteredSections.map(section => (
              <CheatSheetSection key={section.id} section={section} />
            ))
          ) : (
            <div className="cheatsheet-no-results">
              <p>No results found for "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

```jsx
// src/components/CheatSheet/CheatSheetSection.jsx (new component)
export default function CheatSheetSection({ section }) {
  return (
    <div className="cheatsheet-section">
      <h3>{section.title}</h3>
      <div className="cheatsheet-section-content">
        {Object.entries(section.content).map(([key, item]) => (
          <div key={key} className="cheatsheet-item">
            <h4>{item.title}</h4>
            {item.description && <p>{item.description}</p>}
            <pre>{item.code}</pre>
            {item.tip && <p className="tip">{item.tip}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Benefits:**
- ✅ Separation of content from presentation
- ✅ Easy to add/update SQL reference content
- ✅ Better searchability (structured data)
- ✅ Potential for CMS or admin interface
- ✅ Can be loaded asynchronously
- ✅ Testable content structure

**Estimated Time:** 6-8 hours

---

### 1.3 Refactor Flashcards Component (672 lines → ~200 lines)

**Current State:**
- 24 useState hooks (excessive state complexity)
- 672 lines of mixed concerns
- State management, data fetching, UI logic all in one file
- Hard to test and maintain

**Problems Identified:**

```jsx
// Too many state variables!
const [selectedLevel, setSelectedLevel] = useState('basic');
const [cards, setCards] = useState([]);
const [shuffledIndices, setShuffledIndices] = useState([]);
const [currentIndex, setCurrentIndex] = useState(0);
const [isFlipped, setIsFlipped] = useState(false);
const [showOptions, setShowOptions] = useState(false);
const [selectedOption, setSelectedOption] = useState(null);
const [options, setOptions] = useState([]);
const [loadingOptions, setLoadingOptions] = useState(false);
const [cardProgress, setCardProgress] = useState(null);
const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
const [loadingCards, setLoadingCards] = useState(true);
const [totalCardsInDb, setTotalCardsInDb] = useState(0);
const [loadingMore, setLoadingMore] = useState(false);
const [generating, setGenerating] = useState(false);
// ... and more!
```

**Solution: useReducer + Custom Hooks**

**Target Architecture:**

```
src/pages/Flashcards/
├── Flashcards.jsx              # Main component (~150 lines)
├── FlashcardsDeck.jsx          # Deck display component (~100 lines)
├── FlashcardsControls.jsx      # Controls component (~80 lines)
├── hooks/
│   ├── useFlashcardDeck.js     # Deck state management (~120 lines)
│   ├── useFlashcardProgress.js # Progress tracking (~80 lines)
│   └── useFlashcardOptions.js  # Options generation (~60 lines)
└── utils/
    └── flashcardReducer.js     # State reducer (~100 lines)
```

**Implementation:**

```javascript
// src/pages/Flashcards/utils/flashcardReducer.js
export const initialState = {
  cards: [],
  shuffledIndices: [],
  currentIndex: 0,
  isFlipped: false,
  sessionStats: { reviewed: 0, correct: 0 },
  loading: {
    cards: true,
    options: false,
    more: false,
    generating: false
  }
};

export function flashcardReducer(state, action) {
  switch (action.type) {
    case 'SET_CARDS':
      return {
        ...state,
        cards: action.payload,
        shuffledIndices: shuffleArray([...Array(action.payload.length).keys()])
      };

    case 'FLIP_CARD':
      return { ...state, isFlipped: !state.isFlipped };

    case 'NEXT_CARD':
      return {
        ...state,
        currentIndex: (state.currentIndex + 1) % state.cards.length,
        isFlipped: false
      };

    case 'MARK_CORRECT':
      return {
        ...state,
        sessionStats: {
          reviewed: state.sessionStats.reviewed + 1,
          correct: state.sessionStats.correct + 1
        }
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.loadingType]: action.payload }
      };

    default:
      return state;
  }
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

```javascript
// src/pages/Flashcards/hooks/useFlashcardDeck.js
import { useReducer, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { flashcardReducer, initialState } from '../utils/flashcardReducer';

export function useFlashcardDeck(selectedLevel) {
  const [state, dispatch] = useReducer(flashcardReducer, initialState);

  useEffect(() => {
    loadCards(selectedLevel);
  }, [selectedLevel]);

  const loadCards = async (level) => {
    dispatch({ type: 'SET_LOADING', loadingType: 'cards', payload: true });

    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('level', level)
      .order('is_ai_generated', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(5);

    if (!error && data) {
      dispatch({ type: 'SET_CARDS', payload: data });
    }

    dispatch({ type: 'SET_LOADING', loadingType: 'cards', payload: false });
  };

  const flipCard = () => dispatch({ type: 'FLIP_CARD' });
  const nextCard = () => dispatch({ type: 'NEXT_CARD' });
  const markCorrect = () => dispatch({ type: 'MARK_CORRECT' });

  return {
    state,
    actions: {
      flipCard,
      nextCard,
      markCorrect,
      loadCards
    }
  };
}
```

```jsx
// src/pages/Flashcards/Flashcards.jsx (refactored - ~150 lines)
import { useState } from 'react';
import { useFlashcardDeck } from './hooks/useFlashcardDeck';
import { useFlashcardProgress } from './hooks/useFlashcardProgress';
import { useFlashcardOptions } from './hooks/useFlashcardOptions';
import FlashcardDeck from './FlashcardDeck';
import FlashcardsControls from './FlashcardsControls';

export default function Flashcards() {
  const [selectedLevel, setSelectedLevel] = useState('basic');

  const { state: deckState, actions: deckActions } = useFlashcardDeck(selectedLevel);
  const { progress, saveProgress } = useFlashcardProgress();
  const { options, generateOptions } = useFlashcardOptions();

  const currentCard = deckState.cards[deckState.shuffledIndices[deckState.currentIndex]];

  const handleCorrectAnswer = async () => {
    deckActions.markCorrect();
    await saveProgress(currentCard.id, true);
    deckActions.nextCard();
  };

  if (deckState.loading.cards) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="flashcards-page">
      <div className="flashcards-container">
        {/* Level selector */}
        <FlashcardsControls
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          stats={deckState.sessionStats}
        />

        {currentCard && (
          <FlashcardDeck
            card={currentCard}
            isFlipped={deckState.isFlipped}
            onFlip={deckActions.flipCard}
            onNext={deckActions.nextCard}
            onCorrect={handleCorrectAnswer}
          />
        )}
      </div>
    </div>
  );
}
```

**Benefits:**
- ✅ Reduced complexity (24 state vars → 1 state object)
- ✅ Better separation of concerns
- ✅ Easier to test (reducer is pure function)
- ✅ More maintainable
- ✅ Reusable hooks
- ✅ Better performance (fewer re-renders)

**Estimated Time:** 10-12 hours

---

## Priority 2: High Priority Refactoring (Week 3-4)

### 2.1 Refactor Problems Page (392 lines → ~150 lines)

**Current State:**
- 392 lines orchestrating multiple hooks
- Complex state management across multiple child components
- Mixing presentation and business logic

**Solution:**

```
src/pages/Problems/
├── Problems.jsx                    # Main orchestrator (~150 lines)
├── ProblemSetup.jsx               # Setup view (~120 lines)
├── ProblemWorkspace.jsx           # Workspace view (~180 lines)
├── components/
│   ├── ProblemDescription.jsx
│   ├── QueryEditor.jsx
│   ├── QueryResults.jsx
│   ├── FeedbackPanel.jsx
│   ├── HintsModal.jsx
│   ├── SolutionModal.jsx
│   ├── SubmissionHistoryModal.jsx
│   ├── SavedProblemsList.jsx
│   ├── ProgressOverlay.jsx
│   ├── Notepad.jsx
│   ├── TopicFilter.jsx
│   └── SubDifficultySelector.jsx
└── hooks/
    ├── useProblemWorkspace.js     # Orchestrates all problem logic (~150 lines)
    ├── useProblemGeneration.js    # Already exists
    ├── useQueryExecution.js       # Already exists
    ├── useAnswerChecking.js       # Already exists
    ├── useSavedProblems.js        # Already exists
    └── useProgressAutoSave.js     # Already exists
```

**Implementation:**

```javascript
// src/pages/Problems/hooks/useProblemWorkspace.js
import { useState } from 'react';
import { useProblemGeneration } from '../../../hooks/useProblemGeneration';
import { useQueryExecution } from '../../../hooks/useQueryExecution';
import { useAnswerChecking } from '../../../hooks/useAnswerChecking';
import { useSavedProblems } from '../../../hooks/useSavedProblems';
import { useProgress } from '../../../hooks/useProgress';

export function useProblemWorkspace() {
  const [view, setView] = useState('setup');
  const [notes, setNotes] = useState('');
  const [modalStates, setModalStates] = useState({
    hints: false,
    solution: false,
    history: false,
    preview: null
  });

  const progress = useProgress();
  const savedProblems = useSavedProblems(view);
  const problemGen = useProblemGeneration(
    () => setView('workspace'),
    savedProblems.loadSavedProblems
  );
  const queryExec = useQueryExecution();
  const answerCheck = useAnswerChecking();

  const openModal = (modal, data = true) => {
    setModalStates(prev => ({ ...prev, [modal]: data }));
  };

  const closeModal = (modal) => {
    setModalStates(prev => ({ ...prev, [modal]: false }));
  };

  const handleNextProblem = () => {
    setView('setup');
    queryExec.clearQuery();
    answerCheck.resetFeedback();
    setNotes('');
  };

  return {
    view,
    setView,
    notes,
    setNotes,
    modalStates,
    openModal,
    closeModal,
    progress,
    savedProblems,
    problemGen,
    queryExec,
    answerCheck,
    handleNextProblem
  };
}
```

```jsx
// src/pages/Problems/Problems.jsx (refactored - ~150 lines)
import { useProblemWorkspace } from './hooks/useProblemWorkspace';
import ProblemSetup from './ProblemSetup';
import ProblemWorkspace from './ProblemWorkspace';
import ProgressOverlay from './components/ProgressOverlay';

export default function Problems() {
  const workspace = useProblemWorkspace();

  if (workspace.problemGen.loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="problems-page">
      {workspace.view === 'setup' ? (
        <ProblemSetup workspace={workspace} />
      ) : (
        <ProblemWorkspace workspace={workspace} />
      )}

      <ProgressOverlay
        showProgress={workspace.progress.showProgress}
        progress={workspace.progress.progress}
        progressMessage={workspace.progress.progressMessage}
      />
    </div>
  );
}
```

**Benefits:**
- ✅ Cleaner separation between setup and workspace
- ✅ Single source of truth for workspace state
- ✅ Easier to test business logic
- ✅ More maintainable

**Estimated Time:** 8-10 hours

---

### 2.2 Split QuestionRenderer Component (364 lines → ~100 lines)

**Current State:**
- Single component handling multiple question types
- Long switch/case statements
- Hard to add new question types

**Solution:**

```
src/components/Assessment/
├── QuestionRenderer.jsx           # Router component (~100 lines)
└── questionTypes/
    ├── MultipleChoiceQuestion.jsx # (~80 lines)
    ├── CodeQuestion.jsx           # (~100 lines)
    ├── TrueFalseQuestion.jsx      # (~60 lines)
    ├── OrderingQuestion.jsx       # (~90 lines)
    └── index.js                   # Export all types
```

**Implementation:**

```jsx
// src/components/Assessment/QuestionRenderer.jsx (refactored)
import {
  MultipleChoiceQuestion,
  CodeQuestion,
  TrueFalseQuestion,
  OrderingQuestion
} from './questionTypes';

const QUESTION_COMPONENTS = {
  'multiple_choice': MultipleChoiceQuestion,
  'code': CodeQuestion,
  'true_false': TrueFalseQuestion,
  'ordering': OrderingQuestion
};

export default function QuestionRenderer({ question, answer, onAnswerChange }) {
  const QuestionComponent = QUESTION_COMPONENTS[question.question_type];

  if (!QuestionComponent) {
    return <div>Unknown question type: {question.question_type}</div>;
  }

  return (
    <div className="question-container">
      <QuestionComponent
        question={question}
        answer={answer}
        onAnswerChange={onAnswerChange}
      />
    </div>
  );
}
```

**Benefits:**
- ✅ Easy to add new question types
- ✅ Better code organization
- ✅ Smaller, focused components
- ✅ Easier testing

**Estimated Time:** 6-8 hours

---

## Priority 3: Medium Priority Refactoring (Week 5-6)

### 3.1 Create Shared Component Library

**Problem:** Repeated patterns across components (buttons, modals, forms)

**Solution:**

```
src/components/ui/
├── Button/
│   ├── Button.jsx
│   ├── Button.module.css
│   └── index.js
├── Modal/
│   ├── Modal.jsx
│   ├── ModalHeader.jsx
│   ├── ModalBody.jsx
│   ├── ModalFooter.jsx
│   ├── Modal.module.css
│   └── index.js
├── Form/
│   ├── Input.jsx
│   ├── Select.jsx
│   ├── Textarea.jsx
│   ├── Form.module.css
│   └── index.js
├── Card/
│   ├── Card.jsx
│   ├── CardHeader.jsx
│   ├── CardBody.jsx
│   ├── Card.module.css
│   └── index.js
└── index.js  # Export all UI components
```

**Usage:**

```jsx
import { Button, Modal, Card } from '@/components/ui';

<Button variant="primary" size="large" onClick={handleClick}>
  Generate Problem
</Button>

<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>Title</Modal.Header>
  <Modal.Body>Content</Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
  </Modal.Footer>
</Modal>
```

**Benefits:**
- ✅ Consistent UI across app
- ✅ Easier to maintain
- ✅ Better accessibility
- ✅ Reduced code duplication

**Estimated Time:** 12-16 hours

---

### 3.2 Implement Code Splitting

**Current State:** All code loaded upfront

**Solution:**

```jsx
// src/App.jsx
import { lazy, Suspense } from 'react';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load route components
const Home = lazy(() => import('./pages/Home'));
const Learn = lazy(() => import('./pages/Learn'));
const Problems = lazy(() => import('./pages/Problems'));
const Flashcards = lazy(() => import('./pages/Flashcards'));
const Assessment = lazy(() => import('./pages/Assessment'));
const Settings = lazy(() => import('./pages/Settings'));

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/problems" element={<Problems />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

**Benefits:**
- ✅ Faster initial load
- ✅ Better performance on mobile
- ✅ Only load what's needed

**Estimated Time:** 4-6 hours

---

### 3.3 Extract Utility Functions

**Problem:** Utility functions scattered throughout components

**Solution:**

```
src/utils/
├── array/
│   ├── shuffle.js
│   └── chunk.js
├── string/
│   ├── truncate.js
│   └── capitalize.js
├── date/
│   ├── formatDate.js
│   └── getRelativeTime.js
├── validation/
│   ├── validateEmail.js
│   └── validateSQL.js
└── index.js  # Export all utilities
```

**Example:**

```javascript
// src/utils/array/shuffle.js
export function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Usage
import { shuffle } from '@/utils/array';
const shuffledCards = shuffle(cards);
```

**Estimated Time:** 4-6 hours

---

## Priority 4: Long-term Improvements (Ongoing)

### 4.1 Migrate to TypeScript (Optional)

**Benefits:**
- Type safety
- Better IDE support
- Fewer runtime errors
- Self-documenting code

**Approach:** Gradual migration (`.jsx` → `.tsx`)

**Estimated Time:** 3-4 weeks (incremental)

---

### 4.2 Add Storybook for Component Development

**Benefits:**
- Isolated component development
- Visual testing
- Documentation
- Better collaboration

**Estimated Time:** 1-2 weeks

---

### 4.3 Implement Testing Strategy

```
tests/
├── unit/           # Jest unit tests
├── integration/    # Integration tests
└── e2e/           # Playwright/Cypress E2E tests
```

**Estimated Time:** 3-4 weeks

---

## Implementation Roadmap

### Week 1-2: Critical Refactoring
- [ ] Split monolithic CSS file (12 hours)
- [ ] Extract CheatSheet content to data (8 hours)
- [ ] Refactor Flashcards component (12 hours)
- **Total:** 32 hours (4 days)

### Week 3-4: High Priority
- [ ] Refactor Problems page (10 hours)
- [ ] Split QuestionRenderer (8 hours)
- [ ] Code review and testing (6 hours)
- **Total:** 24 hours (3 days)

### Week 5-6: Medium Priority
- [ ] Create shared component library (16 hours)
- [ ] Implement code splitting (6 hours)
- [ ] Extract utility functions (6 hours)
- **Total:** 28 hours (3.5 days)

### Total Estimated Effort: 84 hours (~10.5 days)

Can be parallelized with mobile improvements if needed.

---

## Success Metrics

### Before Refactoring:
- Largest file: 4,674 lines (index.css)
- Total large files: 6 files > 10K
- Bundle size: ~TBD (measure)
- Time to Interactive: ~TBD (measure)

### After Refactoring (Targets):
- Largest file: < 500 lines
- Total large files: 0 files > 10K
- Bundle size: 20-30% reduction
- Time to Interactive: 15-25% improvement
- Developer satisfaction: "Easier to work with"

---

## Risks & Mitigation

### Risk 1: Breaking Changes
**Mitigation:**
- Comprehensive testing before/after
- Incremental changes with git commits
- Feature flags for major changes

### Risk 2: Time Overruns
**Mitigation:**
- Start with Priority 1 only
- Time-box each task
- Skip Priority 3 if needed

### Risk 3: CSS Breakage
**Mitigation:**
- Visual regression testing
- Test on multiple pages
- Keep original CSS as backup

---

## Dependencies & Prerequisites

**Required:**
- [ ] Git branch for refactoring work
- [ ] Backup of current codebase
- [ ] Testing checklist prepared
- [ ] Team alignment on approach

**Optional:**
- [ ] Storybook setup
- [ ] Visual regression tool
- [ ] Performance monitoring

---

## Recommended Approach

### Option A: Refactor First, Then Mobile (Sequential)
**Pros:** Clean foundation for mobile work
**Cons:** Delays mobile improvements
**Timeline:** 6 weeks refactor + 6-8 weeks mobile = 12-14 weeks total

### Option B: Parallel Development (Recommended)
**Pros:** Faster delivery of both initiatives
**Cons:** Requires coordination, possible merge conflicts
**Timeline:** 6 weeks for both = 6 weeks total

**Suggested:** Hybrid approach:
1. **Week 1-2:** Do Priority 1 refactoring (CSS split, CheatSheet, Flashcards)
2. **Week 3-6:** Parallel mobile + remaining refactoring
3. **Week 7+:** Polish and testing

---

## Next Steps

1. **Review this plan** with team
2. **Choose approach** (Sequential vs Parallel)
3. **Create feature branch:** `refactor/large-files`
4. **Measure baseline metrics** (bundle size, performance)
5. **Start with Priority 1.1** (CSS split)
6. **Validate** after each major change
7. **Document** learnings and patterns

---

## Questions for Discussion

1. Should we migrate to TypeScript during this refactoring?
2. Do we want to introduce CSS Modules or stick with global CSS?
3. Should we add a component library (e.g., Radix UI, Shadcn)?
4. What's the priority: refactoring vs mobile improvements?
5. Do we have capacity for parallel development?

---

## Conclusion

This refactoring plan addresses the most critical technical debt in the codebase. The largest impact items are:

1. **CSS Split** (90K → 15-20K) - Biggest file size reduction
2. **CheatSheet Extraction** (757 → 100 lines) - Content/code separation
3. **Flashcards Refactor** (672 → 200 lines) - Complexity reduction

Completing Priority 1 and 2 will significantly improve:
- Developer experience
- Maintainability
- Performance
- Foundation for mobile improvements

The modular approach allows us to tackle items incrementally and validate changes continuously.
