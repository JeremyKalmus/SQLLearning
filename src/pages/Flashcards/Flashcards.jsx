import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFlashcardDeck } from './hooks/useFlashcardDeck';
import { useFlashcardProgress } from './hooks/useFlashcardProgress';
import { useFlashcardOptions } from './hooks/useFlashcardOptions';
import FlashcardsControls from './FlashcardsControls';
import FlashcardDeck from './FlashcardDeck';

/**
 * Main Flashcards Component
 * Manages flashcard learning experience with multiple choice options
 */
export default function Flashcards() {
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState('basic');

  // Deck management hook - handles card loading, shuffling, and completion
  const {
    state,
    dispatch,
    currentCard,
    totalCardsInDb,
    batchCompleted,
    allCompleted,
    loadMoreCards,
    generateFlashcards,
    checkCurrentBatchCompletion,
    checkAllDatabaseCardsCompleted
  } = useFlashcardDeck(selectedLevel, user);

  /**
   * Callback to re-check completion status after progress update
   */
  const handleProgressUpdate = useCallback(async () => {
    const batchDone = await checkCurrentBatchCompletion();
    if (batchDone) {
      await checkAllDatabaseCardsCompleted();
    }
  }, [checkCurrentBatchCompletion, checkAllDatabaseCardsCompleted]);

  // Progress tracking hook - handles user progress and statistics
  const { cardProgress, updateProgress } = useFlashcardProgress(
    currentCard,
    user,
    selectedLevel,
    dispatch,
    handleProgressUpdate
  );

  // Options management hook - handles multiple choice options
  useFlashcardOptions(currentCard, selectedLevel, dispatch, state.currentIndex);

  /**
   * Handle level change
   * @param {string} level - New difficulty level
   */
  const handleLevelChange = (level) => {
    setSelectedLevel(level);
  };

  /**
   * Handle card flip
   */
  const handleFlip = () => {
    dispatch({ type: 'FLIP_CARD' });
  };

  /**
   * Handle next card navigation
   */
  const handleNext = () => {
    if (state.currentIndex < state.shuffledIndices.length - 1) {
      dispatch({ type: 'NEXT_CARD' });
    }
  };

  /**
   * Handle previous card navigation
   */
  const handlePrevious = () => {
    if (state.currentIndex > 0) {
      dispatch({ type: 'PREVIOUS_CARD' });
    }
  };

  /**
   * Handle option selection
   * @param {Object} option - Selected option
   * @param {number} index - Index of selected option
   */
  const handleOptionSelect = async (option, index) => {
    // If user already selected a wrong answer, allow them to try again
    if (
      state.selectedOption !== null &&
      state.options[state.selectedOption]?.correct === false
    ) {
      dispatch({ type: 'SELECT_OPTION', payload: index });
      if (option.correct) {
        await updateProgress(true);
      }
      return;
    }

    // If user already selected the correct answer, don't allow changing
    if (
      state.selectedOption !== null &&
      state.options[state.selectedOption]?.correct === true
    ) {
      return;
    }

    // First selection
    dispatch({ type: 'SELECT_OPTION', payload: index });
    await updateProgress(option.correct);
  };

  /**
   * Handle reset selection (Try Again button)
   */
  const handleResetSelection = () => {
    dispatch({ type: 'RESET_SELECTION' });
  };

  // Loading state
  if (state.loading.cards) {
    return (
      <div className="flashcards-page">
        <div className="flashcards-container">
          <h1>Loading flashcards...</h1>
        </div>
      </div>
    );
  }

  // No cards available
  if (!currentCard) {
    return (
      <div className="flashcards-page">
        <div className="flashcards-container">
          <h1>No flashcards available</h1>
          {batchCompleted && allCompleted && (
            <button
              className="btn btn-primary"
              onClick={generateFlashcards}
              disabled={state.loading.generating}
            >
              {state.loading.generating ? 'Generating...' : 'Generate 5 More Flashcards'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flashcards-page">
      <div className="flashcards-container">
        <h1>SQL Flashcards</h1>

        {/* Controls: Level selector and statistics */}
        <FlashcardsControls
          selectedLevel={selectedLevel}
          onLevelChange={handleLevelChange}
          currentIndex={state.currentIndex}
          totalCards={state.cards.length}
          cardProgress={cardProgress}
          sessionStats={state.sessionStats}
          batchCompleted={batchCompleted}
          allCompleted={allCompleted}
          totalCardsInDb={totalCardsInDb}
          onLoadMore={loadMoreCards}
          onGenerate={generateFlashcards}
          loadingMore={state.loading.more}
          generating={state.loading.generating}
        />

        {/* Deck: Flashcard display and navigation */}
        <FlashcardDeck
          currentCard={currentCard}
          isFlipped={state.isFlipped}
          onFlip={handleFlip}
          showOptions={state.showOptions}
          options={state.options}
          selectedOption={state.selectedOption}
          onOptionSelect={handleOptionSelect}
          loadingOptions={state.loading.options}
          onNext={handleNext}
          onPrevious={handlePrevious}
          currentIndex={state.currentIndex}
          totalCards={state.cards.length}
          onResetSelection={handleResetSelection}
        />
      </div>
    </div>
  );
}
