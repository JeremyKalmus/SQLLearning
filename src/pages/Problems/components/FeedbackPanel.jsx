import PropTypes from 'prop-types';
import { parsePraise } from '../../../utils/parsePraise';

export default function FeedbackPanel({ 
  feedback, 
  showFeedbackDetails, 
  onToggleDetails, 
  onNextProblem 
}) {
  if (!feedback) return null;

  return (
    <div className={`feedback-panel ${feedback.correct ? 'success' : 'info'}`}>
      <div className="feedback-content">
        <div className="feedback-header">
          <h4>Feedback</h4>
          <div className="feedback-score">Score: {feedback.score}/100</div>
        </div>
        {!showFeedbackDetails && (
          <div className="feedback-summary">
            <button
              className="btn btn-secondary btn-view-feedback"
              onClick={onToggleDetails}
            >
              View Detailed Feedback
            </button>
          </div>
        )}
        {showFeedbackDetails && (
          <div className="feedback-details">
            <div className="feedback-message">{feedback.message}</div>
            {feedback.praise && (
              <div className="feedback-praise">
                <strong>What you did well:</strong>
                <ul>
                  {parsePraise(feedback.praise).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {feedback.improvements && feedback.improvements.length > 0 && (
              <div className="feedback-improvements">
                <strong>Suggestions for improvement:</strong>
                <ul>
                  {feedback.improvements.map((improvement, i) => (
                    <li key={i}>{improvement}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              className="btn btn-link btn-small"
              onClick={onToggleDetails}
            >
              Hide details
            </button>
          </div>
        )}
      </div>
      <div className="feedback-actions">
        <button
          className="btn btn-success"
          onClick={onNextProblem}
        >
          Next Problem
        </button>
      </div>
    </div>
  );
}

FeedbackPanel.propTypes = {
  feedback: PropTypes.object,
  showFeedbackDetails: PropTypes.bool.isRequired,
  onToggleDetails: PropTypes.func.isRequired,
  onNextProblem: PropTypes.func.isRequired
};

