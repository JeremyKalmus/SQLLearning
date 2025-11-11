import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, SQLDialect } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { Play } from 'lucide-react';
import PropTypes from 'prop-types';
import { useAuth } from '../../../../contexts/AuthContext';
import QueryResults from '../../../Problems/components/QueryResults';

export default function InteractiveSection({ content }) {
  const { session } = useAuth();
  const [query, setQuery] = useState(content.starterQuery || '');
  const [results, setResults] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);

  if (!content) return null;

  const handleRunQuery = async () => {
    if (!query.trim()) return;

    setExecuting(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({ query })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Query execution failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="interactive-section">
      <div className="instructions" style={{ marginBottom: '1.5rem' }}>
        <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>{content.instructions}</p>

        {content.tasks && content.tasks.length > 0 && (
          <div className="tasks" style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '1rem' }}>Tasks:</h4>
            <ol style={{ listStyle: 'decimal', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
              {content.tasks.map((task, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem' }}>
                  {task.instruction}
                  {task.hint && (
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                      (Hint: {task.hint})
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="code-editor" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h4 style={{ fontWeight: '600', fontSize: '1rem' }}>Your Query</h4>
          <button
            onClick={handleRunQuery}
            disabled={executing || !query.trim()}
            className="btn btn-primary"
            style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
          >
            <Play size={14} />
            Run Query
          </button>
        </div>
        <CodeMirror
          value={query}
          height="250px"
          extensions={[sql({ dialect: SQLDialect.StandardSQL })]}
          theme={oneDark}
          onChange={(value) => setQuery(value)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            autocompletion: true,
          }}
        />
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
          <p>{error}</p>
        </div>
      )}

      {results && (
        <div style={{ marginTop: '1.5rem' }}>
          <QueryResults result={results} />
        </div>
      )}
    </div>
  );
}

InteractiveSection.propTypes = {
  content: PropTypes.object.isRequired
};

