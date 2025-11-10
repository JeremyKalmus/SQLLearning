import { CheckCircle, Lock, X } from 'lucide-react';
import PropTypes from 'prop-types';

export default function SolutionModal({ solution, explanation, hasSubmitted, isOpen, onClose }) {
  if (!isOpen || !solution) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-solution" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header modal-header-solution">
          <h3>
            {hasSubmitted ? (
              <>
                <CheckCircle size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                Solution
              </>
            ) : (
              <>
                <Lock size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                Solution Locked
              </>
            )}
          </h3>
          <button
            className="btn-icon-small"
            onClick={onClose}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {!hasSubmitted ? (
            <div className="solution-locked-message-modal">
              <p>Submit your answer for review at least once to unlock the solution.</p>
            </div>
          ) : (
            <div className="solution-content-modal">
              <div className="solution-query">
                <h5>SQL Query:</h5>
                <pre><code>{solution}</code></pre>
              </div>
              {explanation && (
                <div className="solution-explanation">
                  <h5>Explanation:</h5>
                  <p>{explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

SolutionModal.propTypes = {
  solution: PropTypes.string.isRequired,
  explanation: PropTypes.string,
  hasSubmitted: PropTypes.bool.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};
