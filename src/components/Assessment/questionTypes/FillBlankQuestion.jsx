import PropTypes from 'prop-types';

export default function FillBlankQuestion({ questionData, answer, onAnswerChange, submitted }) {
  // Convert literal \n strings to actual newlines
  const queryTemplate = (questionData.queryTemplate || '')
    .replace(/\\n/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\r/g, '\n');

  return (
    <div className="question-fill-blank">
      <h2>{questionData.question}</h2>
      <div className="query-template">
        <pre>{queryTemplate}</pre>
      </div>
      <div className="blanks-input">
        {questionData.blanks.map((blank, index) => (
          <div key={index} className="blank-item">
            <label>Blank {index + 1}:</label>
            <input
              type="text"
              value={answer?.blanks?.[index] || ''}
              onChange={(e) => {
                const newBlanks = [...(answer?.blanks || [])];
                newBlanks[index] = e.target.value;
                onAnswerChange({ blanks: newBlanks });
              }}
              disabled={submitted}
              className="blank-input"
              placeholder="Enter keyword..."
            />
          </div>
        ))}
      </div>
    </div>
  );
}

FillBlankQuestion.propTypes = {
  questionData: PropTypes.shape({
    question: PropTypes.string.isRequired,
    queryTemplate: PropTypes.string.isRequired,
    blanks: PropTypes.array.isRequired,
  }).isRequired,
  answer: PropTypes.shape({
    blanks: PropTypes.arrayOf(PropTypes.string),
  }),
  onAnswerChange: PropTypes.func.isRequired,
  submitted: PropTypes.bool.isRequired,
};
