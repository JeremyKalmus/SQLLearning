import PropTypes from 'prop-types';
import CodeMirror from '@uiw/react-codemirror';
import { sql, SQLDialect } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';

export default function FindErrorQuestion({ questionData, answer, onAnswerChange, submitted }) {
  // Convert literal \n strings to actual newlines
  const brokenQuery = (questionData.brokenQuery || '')
    .replace(/\\n/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\r/g, '\n');

  return (
    <div className="question-find-error">
      <h2>{questionData.question}</h2>
      <div className="broken-query">
        <h3>Broken Query:</h3>
        <CodeMirror
          value={brokenQuery}
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
      <div className="fix-query">
        <h3>Your Fix:</h3>
        <CodeMirror
          value={answer?.fixedQuery || ''}
          height="250px"
          extensions={[sql({
            dialect: SQLDialect.StandardSQL,
            upperCaseKeywords: true
          })]}
          theme={oneDark}
          onChange={(value) => onAnswerChange({ fixedQuery: value })}
          placeholder="-- Write the corrected query or describe the error..."
          editable={!submitted}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            dropCursor: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightSelectionMatches: true,
          }}
          style={{
            fontSize: '14px',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        />
      </div>
    </div>
  );
}

FindErrorQuestion.propTypes = {
  questionData: PropTypes.shape({
    question: PropTypes.string.isRequired,
    brokenQuery: PropTypes.string.isRequired,
  }).isRequired,
  answer: PropTypes.shape({
    fixedQuery: PropTypes.string,
  }),
  onAnswerChange: PropTypes.func.isRequired,
  submitted: PropTypes.bool.isRequired,
};
