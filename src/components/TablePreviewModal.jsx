import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

export default function TablePreviewModal({ tableName, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && tableName) {
      loadTableData();
    } else {
      // Reset state when modal closes
      setData(null);
      setError(null);
    }
  }, [isOpen, tableName]);

  const loadTableData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use fetch directly since Supabase functions.invoke doesn't support query params well
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-sample-data?table=${encodeURIComponent(tableName)}&limit=10`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      if (result.error) throw new Error(result.error);

      setData(result);
    } catch (err) {
      console.error('Error loading table data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{tableName} - Preview</h3>
          <button className="btn-icon-small" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {loading && (
            <div className="modal-loading">
              <p>Loading table data...</p>
            </div>
          )}
          
          {error && (
            <div className="modal-error">
              <p>Error loading table data: {error}</p>
            </div>
          )}
          
          {!loading && !error && data && (
            <>
              {!data.rows || data.rows.length === 0 ? (
                <p className="no-data-text">No data available in this table.</p>
              ) : (
                <>
                  <div className="preview-table-wrapper">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          {Object.keys(data.rows[0]).map((key) => (
                            <th key={key}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.rows.map((row, i) => (
                          <tr key={i}>
                            {Object.keys(data.rows[0]).map((key) => (
                              <td key={key}>
                                {row[key] !== null && row[key] !== undefined
                                  ? String(row[key])
                                  : <em>NULL</em>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="preview-note">Showing first {data.rows.length} rows</p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

