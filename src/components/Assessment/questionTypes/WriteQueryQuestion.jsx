import PropTypes from 'prop-types';
import CodeMirror from '@uiw/react-codemirror';
import { sql, SQLDialect } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import SchemaViewer from '../../SchemaViewer';

export default function WriteQueryQuestion({ questionData, answer, onAnswerChange, submitted }) {
  return (
    <div className="question-write-query">
      <h2>{questionData.question}</h2>
      <p className="question-description">{questionData.description}</p>
      <div className="schema-viewer-container" style={{ marginBottom: '1rem' }}>
        <SchemaViewer />
      </div>
      <div className="code-editor">
        <CodeMirror
          value={answer?.query || ''}
          height="300px"
          extensions={[sql({
            dialect: SQLDialect.StandardSQL,
            upperCaseKeywords: true
          })]}
          theme={oneDark}
          onChange={(value) => onAnswerChange({ query: value })}
          placeholder="-- Write your SQL query here...\nSELECT * FROM table_name;"
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

WriteQueryQuestion.propTypes = {
  questionData: PropTypes.shape({
    question: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
  answer: PropTypes.shape({
    query: PropTypes.string,
  }),
  onAnswerChange: PropTypes.func.isRequired,
  submitted: PropTypes.bool.isRequired,
};
