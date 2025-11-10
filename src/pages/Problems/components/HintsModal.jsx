import { Lightbulb, Eye, EyeOff, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';

export default function HintsModal({ problemHints, isOpen, onClose, onHintRevealed }) {
  const [revealedHints, setRevealedHints] = useState([]);

  if (!isOpen || !problemHints || problemHints.length === 0) return null;

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Lightbulb size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
            Hints ({revealedHints.length}/{problemHints.length})
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
          <div className="hints-container">
            {problemHints.map((hint, index) => {
              const isRevealed = revealedHints.includes(index);
              const hintText = typeof hint === 'string' ? hint : hint.text || hint;

              return (
                <div key={index} className="hint-item-modal">
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
      </div>
    </div>
  );
}

HintsModal.propTypes = {
  problemHints: PropTypes.array.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onHintRevealed: PropTypes.func
};
