# Codebase Refactoring Recommendations

This document outlines refactoring opportunities for large, monolithic components and files in the SQL Learning codebase.

## Summary of Large Files

| File | Lines | Priority | Status |
|------|-------|----------|--------|
| `src/pages/Problems.jsx` | 862 | 🔴 High | Needs refactoring |
| `src/pages/Flashcards.jsx` | 678 | 🟡 Medium | Needs refactoring |
| `src/components/CheatSheetSlider.jsx` | 383 | 🟢 Low | Extract static data |
| `backend/models.py` | 506 | 🟡 Medium | Split into modules |

---

## 1. `src/pages/Problems.jsx` (862 lines) - HIGH PRIORITY

### Current Issues
- **20+ state variables** - Too many concerns in one component
- **Multiple responsibilities**: API key management, problem generation, query execution, answer checking, hints, saved problems, progress tracking, UI rendering
- **Two distinct views** (setup & workspace) mixed in one component
- **Large render methods** with complex JSX
- **Business logic mixed with UI logic**

### Recommended Refactoring

#### 1.1 Split into Separate Components

```
src/pages/Problems/
├── Problems.jsx                    # Main container (orchestrator)
├── ProblemsSetup.jsx               # Setup view component
├── ProblemsWorkspace.jsx           # Workspace view component
├── components/
│   ├── ProblemDescription.jsx     # Problem header & description
│   ├── QueryEditor.jsx            # CodeMirror editor with actions
│   ├── QueryResults.jsx           # Results table display
│   ├── FeedbackPanel.jsx          # AI feedback display
│   ├── HintsDisplay.jsx           # Hints section
│   ├── SavedProblemsList.jsx      # Saved problems grid
│   └── ProgressOverlay.jsx        # Progress indicator
└── hooks/
    ├── useProblemGeneration.js    # Problem generation logic
    ├── useQueryExecution.js        # Query execution logic
    ├── useAnswerChecking.js        # Answer checking logic
    ├── useHints.js                 # Hints management
    ├── useSavedProblems.js         # Saved problems CRUD
    └── useProgress.js              # Progress tracking
```

#### 1.2 Extract Custom Hooks

**`hooks/useProblemGeneration.js`**
```javascript
// Handles: generateProblem, checkApiKey
// State: hasApiKey, executing, problem
```

**`hooks/useQueryExecution.js`**
```javascript
// Handles: executeQuery
// State: query, result, executing
```

**`hooks/useAnswerChecking.js`**
```javascript
// Handles: checkAnswer, feedback state
// State: feedback, executing
```

**`hooks/useHints.js`**
```javascript
// Handles: getHint
// State: hints, hintsUsed, loadingHint
```

**`hooks/useSavedProblems.js`**
```javascript
// Handles: loadSavedProblems, loadSavedProblem, deleteSavedProblem
// State: savedProblems, loadingSavedProblems
```

**`hooks/useProgress.js`**
```javascript
// Handles: startProgress, completeProgress, progress animation
// State: progress, progressMessage, showProgress
```

#### 1.3 Extract Utility Functions

**`utils/parsePraise.js`**
```javascript
// Move parsePraise helper to separate utility file
```

#### 1.4 Benefits
- ✅ Single Responsibility Principle
- ✅ Easier testing (isolated hooks/components)
- ✅ Better code reusability
- ✅ Improved maintainability
- ✅ Reduced cognitive load

---

## 2. `src/pages/Flashcards.jsx` (678 lines) - MEDIUM PRIORITY

### Current Issues
- **15+ state variables** - Complex state management
- **Multiple responsibilities**: Card loading, progress tracking, options generation, shuffling, navigation
- **Complex callback dependencies** with useCallback
- **Large render method** with nested conditionals

### Recommended Refactoring

#### 2.1 Split into Components

```
src/pages/Flashcards/
├── Flashcards.jsx                  # Main container
├── components/
│   ├── LevelSelector.jsx          # Difficulty level buttons
│   ├── CardCounter.jsx            # Progress counter display
│   ├── FlashcardCard.jsx          # The actual flashcard (front/back)
│   ├── FlashcardOptions.jsx       # Multiple choice options
│   ├── NavigationButtons.jsx      # Previous/Next buttons
│   └── SessionStats.jsx           # Statistics display
└── hooks/
    ├── useFlashcards.js           # Card loading & management
    ├── useFlashcardProgress.js    # Progress tracking
    ├── useFlashcardOptions.js     # Options generation
    └── useFlashcardNavigation.js  # Navigation logic
```

#### 2.2 Extract Custom Hooks

**`hooks/useFlashcards.js`**
```javascript
// Handles: loadFlashcards, handleLoadMore, handleGenerateFlashcards
// State: cards, loadingCards, totalCardsInDb, generating
```

**`hooks/useFlashcardProgress.js`**
```javascript
// Handles: loadCardProgress, updateProgress, checkCurrentBatchCompletion
// State: cardProgress, sessionStats, batchCompleted, allCompleted
```

**`hooks/useFlashcardOptions.js`**
```javascript
// Handles: loadOptionsForCard
// State: options, loadingOptions, selectedOption, showOptions
```

**`hooks/useFlashcardNavigation.js`**
```javascript
// Handles: handleNext, handlePrevious, handleFlip, handleLevelChange
// State: currentIndex, shuffledIndices, isFlipped, selectedLevel
```

#### 2.3 Extract Utilities

**`utils/shuffleArray.js`**
```javascript
// Move shuffleArray helper to utility file
```

---

## 3. `src/components/CheatSheetSlider.jsx` (383 lines) - LOW PRIORITY

### Current Issues
- **Large static data object** embedded in component
- **Hard to maintain** - content changes require editing component

### Recommended Refactoring

#### 3.1 Extract Static Data

**`data/cheatSheetData.js`**
```javascript
// Move cheatSheetSections array to separate data file
export const cheatSheetSections = [
  // ... all sections
];
```

**`components/CheatSheetSlider.jsx`** (simplified)
```javascript
import { cheatSheetSections } from '../data/cheatSheetData';

export default function CheatSheetSlider({ isOpen, onClose }) {
  // Only component logic, no static data
}
```

#### 3.2 Benefits
- ✅ Easier content updates (non-developers can edit JSON)
- ✅ Component focuses on UI logic only
- ✅ Potential to load from external source/API

---

## 4. `backend/models.py` (506 lines) - MEDIUM PRIORITY

### Current Issues
- **Single large class** (ProgressTracker) with many responsibilities
- **Multiple database concerns** mixed together
- **Hard to test** individual features

### Recommended Refactoring

#### 4.1 Split into Separate Classes

```
backend/
├── models/
│   ├── __init__.py
│   ├── base.py                    # Base database connection
│   ├── flashcard_progress.py      # FlashcardProgressTracker
│   ├── problem_history.py         # ProblemHistoryTracker
│   ├── statistics.py              # StatisticsTracker
│   └── saved_problems.py          # SavedProblemsManager
└── database/
    └── migrations.py              # Database initialization
```

#### 4.2 Structure

**`models/flashcard_progress.py`**
```python
class FlashcardProgressTracker:
    def update_flashcard_progress(...)
    def get_flashcard_progress(...)
    def get_flashcard_options(...)
    def save_flashcard_options(...)
```

**`models/problem_history.py`**
```python
class ProblemHistoryTracker:
    def save_problem_attempt(...)
    def get_problem_history(...)
    def get_best_score(...)
```

**`models/statistics.py`**
```python
class StatisticsTracker:
    def update_statistics(...)
    def get_statistics(...)
    def update_streak(...)
```

**`models/saved_problems.py`**
```python
class SavedProblemsManager:
    def save_problem(...)
    def get_saved_problems(...)
    def delete_problem(...)
```

#### 4.3 Benefits
- ✅ Single Responsibility Principle
- ✅ Easier to test individual features
- ✅ Better code organization
- ✅ Easier to add new features

---

## 5. Additional Recommendations

### 5.1 Create Shared Utilities

**`src/utils/`**
```
utils/
├── api.js              # Supabase API helpers
├── validation.js       # Form/data validation
└── formatting.js       # Text formatting utilities
```

### 5.2 Create Constants File

**`src/constants/`**
```
constants/
├── difficultyLevels.js # Difficulty level definitions
├── apiEndpoints.js     # API endpoint constants
└── uiConstants.js      # UI-related constants
```

### 5.3 Consider State Management

For complex state shared across components, consider:
- **Context API** for global state (AuthContext pattern)
- **Zustand** or **Jotai** for simpler state management
- **React Query** for server state management

### 5.4 Testing Strategy

After refactoring:
- Unit tests for hooks
- Component tests for UI components
- Integration tests for workflows

---

## Implementation Priority

1. **Phase 1** (High Impact): Refactor `Problems.jsx`
   - Extract hooks first (non-breaking)
   - Then extract components (incremental)
   
2. **Phase 2** (Medium Impact): Refactor `Flashcards.jsx`
   - Similar approach to Problems.jsx
   
3. **Phase 3** (Low Impact): Extract static data
   - Quick wins: CheatSheetSlider data extraction
   
4. **Phase 4** (Backend): Refactor `models.py`
   - Can be done independently of frontend

---

## Migration Strategy

1. **Start with hooks** - Extract logic without changing components
2. **Test thoroughly** - Ensure no regressions
3. **Extract components incrementally** - One at a time
4. **Update imports** - Gradually migrate
5. **Remove old code** - After verification

---

## Notes

- All refactoring should maintain existing functionality
- Consider using feature flags for gradual rollout
- Update documentation as you refactor
- Add tests for new hooks/components

