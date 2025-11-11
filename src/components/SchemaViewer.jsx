import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Eye } from 'lucide-react';

export default function SchemaViewer({ onTablePreview }) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSchema();
  }, []);

  const loadSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase.functions.invoke('get-schema');

      if (fetchError) throw fetchError;
      if (data.error) throw new Error(data.error);

      setSchema(data);
    } catch (err) {
      console.error('Error loading schema:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="schema-viewer">
      <div className="schema-header">
        <h4>Database Schema</h4>
      </div>
      {loading && <div className="schema-loading">Loading schema...</div>}
      {error && !loading && <div className="schema-error">Error loading schema: {error}</div>}
      {!loading && !error && schema && Object.keys(schema).length > 0 ? (
        <div id="schema-content" className="schema-content">
          <div id="schema-tables" className="schema-tables">
            {Object.entries(schema).map(([tableName, tableInfo]) => {
              const fkColumns = new Set(
                (tableInfo.foreign_keys || []).map(fk => fk.column)
              );

              return (
                <div key={tableName} className="schema-table">
                  <div className="schema-table-header">
                    <h5>{tableName}</h5>
                    {onTablePreview && (
                      <button
                        className="btn-icon-small btn-preview"
                        onClick={() => onTablePreview(tableName)}
                        title="Preview table data"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                  </div>
                  <ul className="schema-columns">
                    {tableInfo.columns.map((col) => {
                      const badges = [];
                      if (col.primary_key) badges.push(<span key="pk" className="pk-badge">PK</span>);
                      if (fkColumns.has(col.name)) badges.push(<span key="fk" className="fk-badge">FK</span>);
                      
                      return (
                        <li key={col.name}>
                          <strong>{col.name}</strong>: {col.type}
                          {badges.length > 0 && <span className="badges">{badges}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {!loading && !error && schema && Object.keys(schema).length === 0 && (
        <div className="schema-empty">No schema data available</div>
      )}
    </div>
  );
}

