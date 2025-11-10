import { CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';

export default function SolutionDisplay({ solution, explanation, hasSubmitted = false }) {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!solution) return null;

  return (
    <div className="solution-display">
      <div className="solution-header">
        <h4>
          <CheckCircle size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
          Solution
        </h4>
        <button
          className="btn-reveal-solution"
          onClick={() => hasSubmitted && setIsRevealed(!isRevealed)}
          title={
            !hasSubmitted
              ? "Submit your answer at least once to unlock the solution"
              : isRevealed
              ? "Hide solution"
              : "Reveal solution"
          }
          disabled={!hasSubmitted}
        >
          {!hasSubmitted ? (
            <>
              <Lock size={14} /> Locked
            </>
          ) : isRevealed ? (
            <>
              <EyeOff size={14} /> Hide Solution
            </>
          ) : (
            <>
              <Eye size={14} /> Reveal Solution
            </>
          )}
        </button>
      </div>
      {!hasSubmitted && (
        <div className="solution-locked-message">
          <p>Submit your answer for review at least once to unlock the solution.</p>
        </div>
      )}
      {hasSubmitted && isRevealed && (
        <div className="solution-content">
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
  );
}

SolutionDisplay.propTypes = {
  solution: PropTypes.string.isRequired,
  explanation: PropTypes.string,
  hasSubmitted: PropTypes.bool
};
