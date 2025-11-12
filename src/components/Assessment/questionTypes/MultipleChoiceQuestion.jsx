import PropTypes from 'prop-types';
import CodeMirror from '@uiw/react-codemirror';
import { sql, SQLDialect } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';

export default function MultipleChoiceQuestion({ questionData, answer, onAnswerChange, submitted }) {
  // Convert literal \n strings to actual newlines
  const codeSnippet = questionData.code
    ? (questionData.code || '')
        .replace(/\\n/g, '\n')
        .replace(/\\r\\n/g, '\n')
        .replace(/\\r/g, '\n')
    : null;

  return (
    <div className="question-multiple-choice">
      <h2>{questionData.question}</h2>
      {codeSnippet && (
        <div className="question-code">
          <CodeMirror
            value={codeSnippet}
            extensions={[sql({
              dialect: SQLDialect.StandardSQL,
              upperCaseKeywords: true
            })]}
            theme={oneDark}
            editable={false}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: false,
              highlightActiveLine: false,
            }}
            style={{
              fontSize: '14px',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          />
        </div>
      )}
      <div className="options-list">
        {questionData.options.map((option, index) => (
          <button
            key={index}
            className={`option-button ${
              answer?.selectedOption === index ? 'selected' : ''
            }`}
            onClick={() => onAnswerChange({ selectedOption: index })}
            disabled={submitted}
          >
            <span className="option-letter">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="option-text">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

MultipleChoiceQuestion.propTypes = {
  questionData: PropTypes.shape({
    question: PropTypes.string.isRequired,
    code: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  answer: PropTypes.shape({
    selectedOption: PropTypes.number,
  }),
  onAnswerChange: PropTypes.func.isRequired,
  submitted: PropTypes.bool.isRequired,
};
