import { Lightbulb } from 'lucide-react';
import PropTypes from 'prop-types';

export default function HintsDisplay({ hints, hintsUsed }) {
  if (!hints || hints.length === 0) return null;

  return (
    <div className="hint-display">
      <h4>
        <Lightbulb size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
        Hints ({hintsUsed}/3)
      </h4>
      {hints.map((hint, index) => (
        <div key={index} className="hint-item">
          <div className="hint-level">Hint {hint.level}:</div>
          <p>{hint.text}</p>
        </div>
      ))}
    </div>
  );
}

HintsDisplay.propTypes = {
  hints: PropTypes.array.isRequired,
  hintsUsed: PropTypes.number.isRequired
};

