import React, { useState } from 'react';
import PropTypes from 'prop-types';

function SingleResultTable({ result, queryIndex, query }) {
  if (result.error) {
    return (
      <div className="error-message">
        <strong>Query {queryIndex} Error:</strong> {result.error}
      </div>
    );
  }

  if (!result.rows || result.rows.length === 0) {
    return <p>Query executed successfully but returned no results.</p>;
  }

  const columns = result.column_order && Array.isArray(result.column_order) 
    ? result.column_order 
    : Object.keys(result.rows[0]);

  return (
    <div className="result-table-container">
      {query && (
        <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <strong>Query {queryIndex}:</strong> <code style={{ fontSize: '0.8rem' }}>{query.substring(0, 100)}{query.length > 100 ? '...' : ''}</code>
        </div>
      )}
      <table className="result-table">
        <thead>
          <tr>
            {columns.map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, i) => (
            <tr key={i}>
              {columns.map((key) => (
                <td key={key}>{String(row[key] ?? 'NULL')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        {result.rowCount || result.rows.length} row{result.rowCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default function QueryResults({ result }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!result) return null;

  // Handle multiple results (tabs)
  if (result.multiple && result.results && Array.isArray(result.results)) {
    return (
      <div className="query-results" id="results-panel">
        <h4>Query Results:</h4>
        {result.results.length === 0 ? (
          <p>No queries executed.</p>
        ) : (
          <>
            {/* Tab navigation */}
            {result.results.length > 1 && (
              <div className="result-tabs" style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '1rem',
                borderBottom: '2px solid var(--border-color)'
              }}>
                {result.results.map((r, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: activeTab === idx ? 'var(--primary-color)' : 'transparent',
                      color: activeTab === idx ? 'white' : 'var(--text-color)',
                      border: 'none',
                      borderBottom: activeTab === idx ? '2px solid var(--primary-color)' : '2px solid transparent',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: activeTab === idx ? '600' : '400',
                      transition: 'all 0.2s'
                    }}
                  >
                    Query {r.queryIndex || idx + 1}
                    {r.error && ' ⚠️'}
                    {!r.error && r.rowCount !== undefined && ` (${r.rowCount})`}
                  </button>
                ))}
              </div>
            )}
            
            {/* Active tab content */}
            <SingleResultTable 
              result={result.results[activeTab]} 
              queryIndex={result.results[activeTab].queryIndex || activeTab + 1}
              query={result.results[activeTab].query}
            />
          </>
        )}
      </div>
    );
  }

  // Handle single result (legacy format)
  return (
    <div className="query-results" id="results-panel">
      <h4>Query Results:</h4>
      {result.error ? (
        <div className="error-message">{result.error}</div>
      ) : result.rows && result.rows.length > 0 ? (
        <div className="result-table-container">
          <table className="result-table">
            <thead>
              <tr>
                {(result.column_order && Array.isArray(result.column_order) 
                  ? result.column_order 
                  : Object.keys(result.rows[0])
                ).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i}>
                  {(result.column_order && Array.isArray(result.column_order)
                    ? result.column_order
                    : Object.keys(result.rows[0])
                  ).map((key) => (
                    <td key={key}>{String(row[key] ?? 'NULL')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Query executed successfully but returned no results.</p>
      )}
    </div>
  );
}

QueryResults.propTypes = {
  result: PropTypes.object
};

