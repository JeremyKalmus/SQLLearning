import PropTypes from 'prop-types';

/**
 * FlashcardsControls Component
 * Displays level selector, card counter, and session statistics
 */
export default function FlashcardsControls({
  selectedLevel,
  onLevelChange,
  currentIndex,
  totalCards,
  cardProgress,
  sessionStats,
  batchCompleted,
  allCompleted,
  totalCardsInDb,
  onLoadMore,
  onGenerate,
  loadingMore,
  generating
}) {
  return (
    <>
      {/* Level Selector */}
      <div className="level-selector">
        <button
          className={`level-btn ${selectedLevel === 'basic' ? 'active' : ''}`}
          onClick={() => onLevelChange('basic')}
        >
          Basic
        </button>
        <button
          className={`level-btn ${selectedLevel === 'intermediate' ? 'active' : ''}`}
          onClick={() => onLevelChange('intermediate')}
        >
          Intermediate
        </button>
        <button
          className={`level-btn ${selectedLevel === 'advanced' ? 'active' : ''}`}
          onClick={() => onLevelChange('advanced')}
        >
          Advanced
        </button>
        <button
          className={`level-btn ${selectedLevel === 'expert' ? 'active' : ''}`}
          onClick={() => onLevelChange('expert')}
        >
          Expert
        </button>
      </div>

      {/* Card Counter with Progress */}
      <div className="card-counter">
        Card {currentIndex + 1} of {totalCards}
        {cardProgress && (
          <span className="card-progress-info">
            {' • '}
            Reviewed {cardProgress.times_seen} time{cardProgress.times_seen !== 1 ? 's' : ''}
            {cardProgress.times_seen > 0 && (
              <span className="accuracy-info">
                {' • '}
                {Math.round((cardProgress.times_correct / cardProgress.times_seen) * 100)}% correct
              </span>
            )}
          </span>
        )}
      </div>

      {/* Session Statistics */}
      {sessionStats.reviewed > 0 && (
        <div className="session-stats">
          <span>Session: {sessionStats.reviewed} reviewed</span>
          <span className="session-accuracy">
            {Math.round((sessionStats.correct / sessionStats.reviewed) * 100)}% correct
          </span>
        </div>
      )}

      {/* Completion Notice */}
      {batchCompleted && (
        <div className="completion-notice">
          {allCompleted ? (
            <div>
              <p>🎉 You&apos;ve completed all available flashcards for this level!</p>
              <button
                className="btn btn-primary"
                onClick={onGenerate}
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Generate 5 More Flashcards'}
              </button>
            </div>
          ) : totalCards < totalCardsInDb ? (
            <div>
              <p>Great job! You&apos;ve completed this batch.</p>
              <button
                className="btn btn-primary"
                onClick={onLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load More Cards'}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

FlashcardsControls.propTypes = {
  selectedLevel: PropTypes.string.isRequired,
  onLevelChange: PropTypes.func.isRequired,
  currentIndex: PropTypes.number.isRequired,
  totalCards: PropTypes.number.isRequired,
  cardProgress: PropTypes.shape({
    times_seen: PropTypes.number,
    times_correct: PropTypes.number
  }),
  sessionStats: PropTypes.shape({
    reviewed: PropTypes.number.isRequired,
    correct: PropTypes.number.isRequired
  }).isRequired,
  batchCompleted: PropTypes.bool.isRequired,
  allCompleted: PropTypes.bool.isRequired,
  totalCardsInDb: PropTypes.number.isRequired,
  onLoadMore: PropTypes.func.isRequired,
  onGenerate: PropTypes.func.isRequired,
  loadingMore: PropTypes.bool.isRequired,
  generating: PropTypes.bool.isRequired
};
