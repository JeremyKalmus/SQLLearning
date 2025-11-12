import PropTypes from 'prop-types';

/**
 * FlashcardDeck Component
 * Displays the flashcard with flip animation, options, and navigation
 */
export default function FlashcardDeck({
  currentCard,
  isFlipped,
  onFlip,
  showOptions,
  options,
  selectedOption,
  onOptionSelect,
  loadingOptions,
  onNext,
  onPrevious,
  currentIndex,
  totalCards,
  onResetSelection
}) {
  if (!currentCard) {
    return null;
  }

  /**
   * Handle option button click
   * @param {Object} option - The selected option
   * @param {number} index - Index of the selected option
   * @param {Event} e - Click event
   */
  const handleOptionClick = (option, index, e) => {
    e.stopPropagation();

    // Allow selecting again if previous selection was wrong
    const wasWrongSelected = selectedOption !== null && options[selectedOption]?.correct === false;
    const canSelect = selectedOption === null || (wasWrongSelected && selectedOption !== index);

    if (canSelect) {
      onOptionSelect(option, index);
    }
  };

  return (
    <>
      {/* Flashcard with flip animation */}
      <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={onFlip}>
        <div className="flashcard-inner">
          {/* Front of card - Question and Options */}
          <div className="flashcard-front">
            <div className="card-topic">{currentCard.topic}</div>
            <div className="card-question">{currentCard.question}</div>

            {/* Multiple Choice Options */}
            <div className="flashcard-options">
              {loadingOptions ? (
                <div className="options-loading">Loading options...</div>
              ) : options.length === 0 ? (
                <div className="options-error">No options available. Please try again.</div>
              ) : (
                <>
                  <div className="options-list">
                    {options.map((option, index) => {
                      const isSelected = selectedOption === index;
                      const isCorrect = option.correct;
                      const wasWrongSelected = selectedOption !== null && options[selectedOption]?.correct === false;
                      const canSelect = selectedOption === null || (wasWrongSelected && !isSelected);

                      return (
                        <button
                          key={index}
                          className={`option-btn ${
                            isSelected
                              ? isCorrect
                                ? 'correct'
                                : 'incorrect'
                              : ''
                          } ${!canSelect && !isSelected ? 'disabled' : ''}`}
                          onClick={(e) => handleOptionClick(option, index, e)}
                          disabled={!canSelect}
                        >
                          {option.text}
                          {isSelected && isCorrect && <span className="checkmark">✓</span>}
                          {isSelected && !isCorrect && <span className="crossmark">✗</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Try Again Button */}
                  {selectedOption !== null && (
                    <div className="options-actions">
                      {options[selectedOption]?.correct === false && (
                        <button
                          className="btn btn-secondary options-try-again-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResetSelection();
                          }}
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Back of card - Answer and Explanation */}
          <div className="flashcard-back">
            <div className="card-topic">{currentCard.topic}</div>
            <div className="card-answer">{currentCard.answer}</div>
            <div className="card-explanation">{currentCard.explanation}</div>
            {currentCard.example && (
              <div className="card-example">
                <strong>Example:</strong>
                <pre>{currentCard.example}</pre>
              </div>
            )}
            <div className="flip-hint">Click to flip back</div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="navigation-buttons">
        <button
          className="btn btn-secondary"
          onClick={onPrevious}
          disabled={currentIndex === 0}
        >
          Previous
        </button>
        <button
          className="btn btn-secondary"
          onClick={onNext}
          disabled={currentIndex >= totalCards - 1}
        >
          Next
        </button>
      </div>
    </>
  );
}

FlashcardDeck.propTypes = {
  currentCard: PropTypes.shape({
    id: PropTypes.number.isRequired,
    topic: PropTypes.string.isRequired,
    question: PropTypes.string.isRequired,
    answer: PropTypes.string.isRequired,
    explanation: PropTypes.string,
    example: PropTypes.string,
    level: PropTypes.string
  }),
  isFlipped: PropTypes.bool.isRequired,
  onFlip: PropTypes.func.isRequired,
  showOptions: PropTypes.bool.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      correct: PropTypes.bool.isRequired
    })
  ).isRequired,
  selectedOption: PropTypes.number,
  onOptionSelect: PropTypes.func.isRequired,
  loadingOptions: PropTypes.bool.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrevious: PropTypes.func.isRequired,
  currentIndex: PropTypes.number.isRequired,
  totalCards: PropTypes.number.isRequired,
  onResetSelection: PropTypes.func.isRequired
};
