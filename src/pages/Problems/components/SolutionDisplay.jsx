import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';

export default function SolutionDisplay({ solution, explanation }) {
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
          onClick={() => setIsRevealed(!isRevealed)}
          title={isRevealed ? "Hide solution" : "Reveal solution"}
        >
          {isRevealed ? (
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
      {isRevealed && (
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
  explanation: PropTypes.string
};
