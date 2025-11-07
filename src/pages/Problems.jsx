import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Problems() {
  const { user } = useAuth();
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('basic');
  const [problem, setProblem] = useState(null);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const { data } = await supabase
      .from('user_api_keys')
      .select('encrypted_api_key')
      .eq('user_id', user.id)
      .maybeSingle();

    setHasApiKey(!!data?.encrypted_api_key);
    setLoading(false);
  };

  const generateProblem = async () => {
    if (!hasApiKey) {
      alert('Please configure your API key in Settings first');
      return;
    }

    setExecuting(true);
    setProblem(null);
    setQuery('');
    setResult(null);
    setFeedback(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-problem', {
        body: { difficulty, user_id: user.id }
      });

      if (error) throw error;
      setProblem(data);
    } catch (error) {
      console.error('Error generating problem:', error);
      alert('Failed to generate problem. Please check your API key and try again.');
    } finally {
      setExecuting(false);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      alert('Please enter a SQL query');
      return;
    }

    setExecuting(true);
    setResult(null);
    setFeedback(null);

    try {
      const { data, error } = await supabase.functions.invoke('execute-query', {
        body: { query, user_id: user.id }
      });

      if (error) throw error;
      setResult(data);
    } catch (error) {
      console.error('Error executing query:', error);
      setResult({ error: error.message });
    } finally {
      setExecuting(false);
    }
  };

  const checkAnswer = async () => {
    if (!query.trim() || !problem) {
      alert('Please enter a query and generate a problem first');
      return;
    }

    setExecuting(true);

    try {
      const { data, error } = await supabase.functions.invoke('check-answer', {
        body: {
          query,
          problem_description: problem.description,
          user_id: user.id,
          difficulty: problem.difficulty,
          topic: problem.topic
        }
      });

      if (error) throw error;
      setFeedback(data);

      await supabase.from('problem_history').insert({
        user_id: user.id,
        problem_title: problem.title,
        difficulty: problem.difficulty,
        topic: problem.topic,
        query,
        score: data.score || 0,
        correct: data.correct || false
      });

      await supabase.from('user_statistics').update({
        total_problems_attempted: supabase.raw('total_problems_attempted + 1'),
        total_problems_solved: supabase.raw(`total_problems_solved + ${data.correct ? 1 : 0}`),
        total_xp: supabase.raw(`total_xp + ${Math.floor((data.score || 0) / 5)}`),
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id);
    } catch (error) {
      console.error('Error checking answer:', error);
      alert('Failed to check answer. Please try again.');
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="problems-page">
      <div className="problems-container">
        <h1>SQL Practice Problems</h1>

        {!hasApiKey && (
          <div className="alert alert-warning">
            <h3>API Key Required</h3>
            <p>You need to configure your Anthropic API key to use this feature.</p>
            <a href="/settings" className="btn-primary">Go to Settings</a>
          </div>
        )}

        <div className="difficulty-selector">
          <label>Difficulty:</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="basic">Basic</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
          <button
            className="btn-primary"
            onClick={generateProblem}
            disabled={executing || !hasApiKey}
          >
            {executing ? 'Generating...' : 'Generate Problem'}
          </button>
        </div>

        {problem && (
          <div className="problem-card">
            <h2>{problem.title}</h2>
            <div className="problem-difficulty">Difficulty: {problem.difficulty}</div>
            <p className="problem-description">{problem.description}</p>
          </div>
        )}

        <div className="query-editor">
          <label>Your SQL Query:</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM ..."
            rows={10}
            disabled={executing}
          />
          <div className="query-actions">
            <button
              className="btn-secondary"
              onClick={executeQuery}
              disabled={executing || !query.trim()}
            >
              Run Query
            </button>
            <button
              className="btn-primary"
              onClick={checkAnswer}
              disabled={executing || !query.trim() || !problem}
            >
              Check Answer
            </button>
          </div>
        </div>

        {result && (
          <div className="result-panel">
            <h3>Query Result:</h3>
            {result.error ? (
              <div className="error-message">{result.error}</div>
            ) : result.rows && result.rows.length > 0 ? (
              <div className="result-table-container">
                <table className="result-table">
                  <thead>
                    <tr>
                      {Object.keys(result.rows[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val, j) => (
                          <td key={j}>{String(val)}</td>
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
        )}

        {feedback && (
          <div className={`feedback-panel ${feedback.correct ? 'success' : 'info'}`}>
            <h3>Feedback:</h3>
            <div className="feedback-score">Score: {feedback.score}/100</div>
            <p className="feedback-message">{feedback.message}</p>
            {feedback.praise && (
              <div className="feedback-praise">
                <strong>What you did well:</strong> {feedback.praise}
              </div>
            )}
            {feedback.improvements && feedback.improvements.length > 0 && (
              <div className="feedback-improvements">
                <strong>Suggestions for improvement:</strong>
                <ul>
                  {feedback.improvements.map((improvement, i) => (
                    <li key={i}>{improvement}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .problems-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .problems-container h1 {
          margin-bottom: 2rem;
        }

        .difficulty-selector {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .difficulty-selector label {
          font-weight: 600;
        }

        .difficulty-selector select {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-size: 1rem;
        }

        .problem-card {
          background: white;
          padding: 2rem;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          margin-bottom: 2rem;
        }

        .problem-card h2 {
          margin-bottom: 0.5rem;
        }

        .problem-difficulty {
          color: var(--primary);
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .problem-description {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .query-editor {
          background: white;
          padding: 2rem;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          margin-bottom: 2rem;
        }

        .query-editor label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .query-editor textarea {
          width: 100%;
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
          resize: vertical;
        }

        .query-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .result-panel,
        .feedback-panel {
          background: white;
          padding: 2rem;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          margin-bottom: 2rem;
        }

        .result-panel h3,
        .feedback-panel h3 {
          margin-bottom: 1rem;
        }

        .result-table-container {
          overflow-x: auto;
        }

        .result-table {
          width: 100%;
          border-collapse: collapse;
        }

        .result-table th,
        .result-table td {
          padding: 0.75rem;
          text-align: left;
          border: 1px solid var(--border);
        }

        .result-table th {
          background: var(--background);
          font-weight: 600;
        }

        .feedback-panel.success {
          border-left: 4px solid var(--success);
        }

        .feedback-panel.info {
          border-left: 4px solid var(--warning);
        }

        .feedback-score {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--primary);
          margin-bottom: 1rem;
        }

        .feedback-message {
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .feedback-praise,
        .feedback-improvements {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--background);
          border-radius: var(--radius);
        }

        .feedback-improvements ul {
          margin-top: 0.5rem;
          margin-left: 1.5rem;
        }

        .feedback-improvements li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}
