import PropTypes from 'prop-types';
import CodeMirror from '@uiw/react-codemirror';
import { sql, SQLDialect } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';

export default function ReadQueryQuestion({ questionData, answer, onAnswerChange, submitted }) {
  // Convert literal \n strings to actual newlines
  const queryToRead = (questionData.queryToRead || '')
    .replace(/\\n/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\r/g, '\n');

  return (
    <div className="question-read-query">
      <h2>{questionData.question}</h2>
      <div className="query-to-read">
        <CodeMirror
          value={queryToRead}
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
          minHeight="150px"
        />
      </div>
      <p className="read-query-prompt">What does this query return?</p>
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

ReadQueryQuestion.propTypes = {
  questionData: PropTypes.shape({
    question: PropTypes.string.isRequired,
    queryToRead: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  answer: PropTypes.shape({
    selectedOption: PropTypes.number,
  }),
  onAnswerChange: PropTypes.func.isRequired,
  submitted: PropTypes.bool.isRequired,
};
