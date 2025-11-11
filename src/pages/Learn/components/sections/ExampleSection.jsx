import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, SQLDialect } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { Play } from 'lucide-react';
import PropTypes from 'prop-types';
import { useAuth } from '../../../../contexts/AuthContext';
import QueryResults from '../../../Problems/components/QueryResults';

export default function ExampleSection({ content }) {
  const { session } = useAuth();
  const [results, setResults] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);

  if (!content) return null;

  const handleRunQuery = async () => {
    if (!content.query) return;

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
          body: JSON.stringify({ query: content.query })
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
    <div className="example-section">
      {content.description && (
        <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>{content.description}</p>
      )}

      <div className="code-example" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h4 style={{ fontWeight: '600', fontSize: '1rem' }}>Example Query</h4>
          <button
            onClick={handleRunQuery}
            disabled={executing || !content.query}
            className="btn btn-primary"
            style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
          >
            <Play size={14} />
            Run Query
          </button>
        </div>
        <CodeMirror
          value={content.query}
          height="200px"
          extensions={[sql({ dialect: SQLDialect.StandardSQL })]}
          theme={oneDark}
          editable={false}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: false,
          }}
        />
      </div>

      {content.annotations && content.annotations.length > 0 && (
        <div className="annotations" style={{ marginBottom: '1rem', marginTop: '1rem' }}>
          <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '1rem' }}>Explanation</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {content.annotations.map((annotation, idx) => (
              <li key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.875rem', lineHeight: '1.6' }}>
                <code style={{ color: 'var(--primary-color)', fontWeight: '500' }}>Line {annotation.line}:</code>{' '}
                {annotation.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.explanation && (
        <div className="explanation" style={{ marginBottom: '1rem', marginTop: '1rem' }}>
          <p style={{ lineHeight: '1.6' }}>{content.explanation}</p>
        </div>
      )}

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

ExampleSection.propTypes = {
  content: PropTypes.object.isRequired
};

