import PropTypes from 'prop-types';

export default function QueryResults({ result }) {
  if (!result) return null;

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

