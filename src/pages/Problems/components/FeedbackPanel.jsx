import PropTypes from 'prop-types';
import { parsePraise } from '../../../utils/parsePraise';

export default function FeedbackPanel({ 
  feedback, 
  onNextProblem 
}) {
  if (!feedback) return null;

  return (
    <div className={`feedback-panel ${feedback.correct ? 'success' : 'info'}`}>
      <div className="feedback-content" role="region" aria-labelledby="feedback-heading">
        <div className="feedback-header">
          <div className="feedback-header-left">
            <h4 id="feedback-heading">Feedback</h4>
            <span className={`feedback-status ${feedback.correct ? 'feedback-status-correct' : 'feedback-status-incorrect'}`}>
              {feedback.correct ? 'Looks Good' : 'Needs Work'}
            </span>
          </div>
          <div className="feedback-score">
            <span className="feedback-score-label">Score</span>
            <span className="feedback-score-value">{feedback.score ?? 0}</span>
          </div>
        </div>

        <div className="feedback-body">
          <p className="feedback-message">{feedback.message}</p>

          {(feedback.praise?.length || feedback.improvements?.length) && (
            <div className="feedback-highlights">
              {feedback.praise && feedback.praise.length > 0 && (
                <div className="feedback-column feedback-column-positive">
                  <h5>What you did well</h5>
                  <ul>
                    {parsePraise(feedback.praise).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.improvements && feedback.improvements.length > 0 && (
                <div className="feedback-column feedback-column-improve">
                  <h5>Suggestions</h5>
                  <ul>
                    {feedback.improvements.map((improvement, i) => (
                      <li key={i}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
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
  onNextProblem: PropTypes.func.isRequired
};

