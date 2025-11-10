import { Lightbulb, Eye, EyeOff } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';

export default function HintsDisplay({ problemHints, onHintRevealed }) {
  const [revealedHints, setRevealedHints] = useState([]);

  if (!problemHints || problemHints.length === 0) return null;

  const handleRevealHint = (index) => {
    if (!revealedHints.includes(index)) {
      setRevealedHints([...revealedHints, index]);
      if (onHintRevealed) {
        onHintRevealed(index + 1);
      }
    }
  };

  const handleHideHint = (index) => {
    setRevealedHints(revealedHints.filter(i => i !== index));
  };

  return (
    <div className="hint-display">
      <h4>
        <Lightbulb size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
        Hints ({revealedHints.length}/3)
      </h4>
      <div className="hints-container">
        {problemHints.map((hint, index) => {
          const isRevealed = revealedHints.includes(index);
          const hintText = typeof hint === 'string' ? hint : hint.text || hint;

          return (
            <div key={index} className="hint-item">
              <div className="hint-header">
                <span className="hint-level">Hint {index + 1}</span>
                <button
                  className="btn-reveal-hint"
                  onClick={() => isRevealed ? handleHideHint(index) : handleRevealHint(index)}
                  title={isRevealed ? "Hide hint" : "Reveal hint"}
                >
                  {isRevealed ? (
                    <>
                      <EyeOff size={14} /> Hide
                    </>
                  ) : (
                    <>
                      <Eye size={14} /> Reveal
                    </>
                  )}
                </button>
              </div>
              {isRevealed && (
                <div className="hint-content">
                  <p>{hintText}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

HintsDisplay.propTypes = {
  problemHints: PropTypes.array.isRequired,
  onHintRevealed: PropTypes.func
};

