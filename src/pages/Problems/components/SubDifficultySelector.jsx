import React from 'react';

const SUB_DIFFICULTIES = {
  intermediate: [
    { value: null, label: 'Standard', description: 'Standard intermediate problems' },
    { value: 'intermediate+', label: 'Intermediate+', description: 'Bridge to Advanced - introduces one new concept' }
  ],
  advanced: [
    { value: 'advanced-', label: 'Advanced-', description: 'Easier Advanced - single concept focus' },
    { value: null, label: 'Standard', description: 'Standard advanced problems' },
    { value: 'advanced+', label: 'Advanced+', description: 'Complex Advanced - multiple concepts' }
  ]
};

export default function SubDifficultySelector({ difficulty, selectedSubDifficulty, onSubDifficultyChange }) {
  const options = SUB_DIFFICULTIES[difficulty];

  if (!options) return null;

  return (
    <div className="option-group">
      <label>Difficulty Variation:</label>
      <div className="sub-difficulty-options">
        {options.map(option => (
          <label
            key={option.value || 'standard'}
            className={`sub-difficulty-option ${selectedSubDifficulty === option.value ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="sub-difficulty"
              value={option.value || ''}
              checked={selectedSubDifficulty === option.value}
              onChange={() => onSubDifficultyChange(option.value)}
            />
            <div className="sub-difficulty-info">
              <div className="sub-difficulty-label">{option.label}</div>
              <div className="sub-difficulty-description">{option.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
