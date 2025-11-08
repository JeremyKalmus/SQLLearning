import { Play, X, Lightbulb, CheckCircle } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, SQLDialect } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import PropTypes from 'prop-types';

export default function QueryEditor({
  query,
  setQuery,
  executing,
  loadingHint,
  hintsUsed,
  problem,
  onExecuteQuery,
  onClearQuery,
  onGetHint,
  onCheckAnswer
}) {
  return (
    <div className="query-editor">
      <h4>Your SQL Query</h4>
      <CodeMirror
        value={query}
        height="300px"
        extensions={[sql({
          dialect: SQLDialect.StandardSQL,
          upperCaseKeywords: true
        })]}
        theme={oneDark}
        onChange={(value) => setQuery(value)}
        placeholder="-- Write your SQL query here...\nSELECT * FROM customers;"
        editable={!executing}
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
      <div className="editor-actions">
        <div className="editor-actions-left">
          <button
            className="btn btn-primary"
            onClick={onExecuteQuery}
            disabled={executing || !query.trim()}
          >
            <Play size={16} />
            Run Query
          </button>
          <button
            className="btn btn-secondary"
            onClick={onClearQuery}
            disabled={executing}
          >
            <X size={16} />
            Clear
          </button>
          <button
            className="btn btn-hint"
            onClick={onGetHint}
            disabled={executing || loadingHint || hintsUsed >= 3 || !problem}
            title={hintsUsed >= 3 ? 'All hints used' : `Get hint ${hintsUsed + 1}/3`}
          >
            <Lightbulb size={16} />
            {loadingHint ? 'Loading...' : `Hint (${hintsUsed}/3)`}
          </button>
        </div>
        <button
          className="btn btn-success"
          onClick={onCheckAnswer}
          disabled={executing || !query.trim() || !problem}
        >
          <CheckCircle size={16} />
          Submit for Review
        </button>
      </div>
    </div>
  );
}

QueryEditor.propTypes = {
  query: PropTypes.string.isRequired,
  setQuery: PropTypes.func.isRequired,
  executing: PropTypes.bool.isRequired,
  loadingHint: PropTypes.bool.isRequired,
  hintsUsed: PropTypes.number.isRequired,
  problem: PropTypes.object,
  onExecuteQuery: PropTypes.func.isRequired,
  onClearQuery: PropTypes.func.isRequired,
  onGetHint: PropTypes.func.isRequired,
  onCheckAnswer: PropTypes.func.isRequired
};

