import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Play, CheckCircle, X, Lightbulb, ArrowLeft, Trash2, Target } from 'lucide-react';
import SchemaViewer from '../components/SchemaViewer';
import TablePreviewModal from '../components/TablePreviewModal';

export default function Problems() {
  const { user } = useAuth();
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('setup'); // 'setup' or 'workspace'
  const [difficulty, setDifficulty] = useState('intermediate');
  const [problem, setProblem] = useState(null);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [savedProblems, setSavedProblems] = useState([]);
  const [loadingSavedProblems, setLoadingSavedProblems] = useState(false);
  const [previewTable, setPreviewTable] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showFeedbackDetails, setShowFeedbackDetails] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  useEffect(() => {
    if (view === 'setup' && user) {
      loadSavedProblems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, user]);

  const checkApiKey = async () => {
    const { data } = await supabase
      .from('user_api_keys')
      .select('encrypted_api_key')
      .eq('user_id', user.id)
      .maybeSingle();

    setHasApiKey(!!data?.encrypted_api_key);
    setLoading(false);
  };

  const loadSavedProblems = async () => {
    try {
      setLoadingSavedProblems(true);
      
      // Fetch saved problems
      const { data: savedData, error: savedError } = await supabase
        .from('saved_problems')
        .select('id, problem_data, created_at, last_accessed')
        .eq('user_id', user.id)
        .order('last_accessed', { ascending: false })
        .limit(50);

      if (savedError) throw savedError;

      // For each saved problem, get best score and attempts from problem_history
      const problemsWithStats = await Promise.all(
        (savedData || []).map(async (sp) => {
          const problemData = sp.problem_data;
          const problemTitle = problemData?.title || '';

          // Get history for this problem
          const { data: historyData, error: historyError } = await supabase
            .from('problem_history')
            .select('score, correct')
            .eq('user_id', user.id)
            .eq('problem_title', problemTitle)
            .order('score', { ascending: false });

          if (historyError) {
            console.error('Error fetching history:', historyError);
            return {
              ...sp,
              problem: problemData,
              best_score: null,
              attempts: 0,
              solved: false,
            };
          }

          const attempts = historyData?.length || 0;
          const bestScore = historyData && historyData.length > 0 ? historyData[0].score : null;
          const solved = historyData?.some(h => h.correct) || false;

          return {
            ...sp,
            problem: problemData,
            best_score: bestScore,
            attempts: attempts,
            solved: solved,
          };
        })
      );

      setSavedProblems(problemsWithStats);
    } catch (error) {
      console.error('Error loading saved problems:', error);
    } finally {
      setLoadingSavedProblems(false);
    }
  };

  const loadSavedProblem = async (problemId) => {
    try {
      setExecuting(true);
      
      const { data, error } = await supabase
        .from('saved_problems')
        .select('problem_data')
        .eq('id', problemId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Update last_accessed
      await supabase
        .from('saved_problems')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', problemId)
        .eq('user_id', user.id);

      setProblem(data.problem_data);
      setQuery('');
      setResult(null);
      setFeedback(null);
      setView('workspace');
    } catch (error) {
      console.error('Error loading saved problem:', error);
      alert('Failed to load problem. Please try again.');
    } finally {
      setExecuting(false);
    }
  };

  const deleteSavedProblem = async (problemId, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this saved problem?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('saved_problems')
        .delete()
        .eq('id', problemId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      loadSavedProblems();
    } catch (error) {
      console.error('Error deleting problem:', error);
      alert('Failed to delete problem.');
    }
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
      
      // Check if a problem with the same title already exists for this user
      const { data: existingProblems } = await supabase
        .from('saved_problems')
        .select('problem_data')
        .eq('user_id', user.id);
      
      // Only save if it's a new problem (different title)
      let isDuplicate = false;
      if (existingProblems && Array.isArray(existingProblems)) {
        isDuplicate = existingProblems.some((sp) => {
          return sp && sp.problem_data && sp.problem_data.title === data.title;
        });
      }
      
      if (!isDuplicate) {
        // Save the problem
        const { error: saveError } = await supabase
          .from('saved_problems')
          .insert({
            user_id: user.id,
            problem_data: data,
          });

        if (saveError) {
          console.error('Error saving problem:', saveError);
        }
      }

      setProblem(data);
      setView('workspace');
      loadSavedProblems(); // Reload saved problems list
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
      // Use fetch directly to get better error handling
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${supabaseUrl}/functions/v1/execute-query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle HTTP errors
        const errorMsg = result.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      // Check if the response contains an error
      if (result.error) {
        throw new Error(result.error);
      }
      
      setResult(result);
    } catch (error) {
      console.error('Error executing query:', error);
      let errorMessage = 'Failed to execute query. Please check your SQL syntax.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.error) {
        errorMessage = error.error;
      } else {
        errorMessage = String(error);
      }
      
      setResult({ error: errorMessage });
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
      // Get user statistics before checking answer
      const { data: statsData } = await supabase
        .from('user_statistics')
        .select('total_problems_attempted, total_problems_solved, total_xp')
        .eq('user_id', user.id)
        .maybeSingle();

      const userLevel = statsData?.total_xp ? Math.floor(statsData.total_xp / 100) + 1 : 1;
      const problemsSolved = statsData?.total_problems_solved || 0;

      const { data, error } = await supabase.functions.invoke('check-answer', {
        body: {
          query,
          problem_description: problem.description,
          user_id: user.id,
          difficulty: problem.difficulty,
          topic: problem.topic,
          student_level: userLevel,
          problems_solved: problemsSolved
        }
      });

      if (error) throw error;
      setFeedback(data);
      setShowFeedbackDetails(false); // Reset to collapsed state

      await supabase.from('problem_history').insert({
        user_id: user.id,
        problem_title: problem.title,
        difficulty: problem.difficulty,
        topic: problem.topic,
        query,
        score: data.score || 0,
        correct: data.correct || false
      });

      // Update statistics using the statsData we already fetched

      if (statsData) {
        await supabase
          .from('user_statistics')
          .update({
            total_problems_attempted: (statsData.total_problems_attempted || 0) + 1,
            total_problems_solved: (statsData.total_problems_solved || 0) + (data.correct ? 1 : 0),
            total_xp: (statsData.total_xp || 0) + Math.floor((data.score || 0) / 5),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }

      // Reload saved problems to update scores
      if (view === 'setup') {
        loadSavedProblems();
      }
    } catch (error) {
      console.error('Error checking answer:', error);
      alert('Failed to check answer. Please try again.');
    } finally {
      setExecuting(false);
    }
  };

  const handleTablePreview = (tableName) => {
    setPreviewTable(tableName);
    setShowPreviewModal(true);
  };

  const clearQuery = () => {
    setQuery('');
    setResult(null);
    setFeedback(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Setup View
  if (view === 'setup') {
    return (
      <div className="problems-page">
        <div className="problems-container">
          <div className="page-header">
            <h1>Problem-Solving Mode</h1>
          </div>

          {!hasApiKey && (
            <div className="alert alert-warning">
              <h3>API Key Required</h3>
              <p>You need to configure your Anthropic API key to use this feature.</p>
              <a href="/settings" className="btn btn-primary">Go to Settings</a>
            </div>
          )}

          <div className="problem-setup">
            <h3>Choose Your Challenge</h3>
            <div className="setup-options">
              <div className="option-group">
                <label>Difficulty Level:</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="basic">Basic - SELECT, WHERE, simple filtering</option>
                  <option value="intermediate">Intermediate - JOINs, GROUP BY, aggregates</option>
                  <option value="advanced">Advanced - Window functions, CTEs, subqueries</option>
                  <option value="expert">Expert - Recursive CTEs, complex analytics</option>
                </select>
              </div>
              <button
                className="btn btn-primary btn-large"
                onClick={generateProblem}
                disabled={executing || !hasApiKey}
              >
                {executing ? 'Generating...' : 'Generate New Problem'}
              </button>
            </div>

            <div className="saved-problems-section">
              <h4>Saved Problems</h4>
              {loadingSavedProblems ? (
                <div className="loading-text">Loading saved problems...</div>
              ) : savedProblems.length === 0 ? (
                <div className="no-problems-text">No saved problems yet. Generate a problem to get started!</div>
              ) : (
                <div className="saved-problems-list">
                  {savedProblems.map((sp) => {
                    const p = sp.problem;
                    const createdDate = new Date(sp.created_at).toLocaleDateString();
                    const bestScore = sp.best_score !== null ? sp.best_score : null;
                    const attempts = sp.attempts || 0;
                    const solved = sp.solved || false;

                    return (
                      <div
                        key={sp.id}
                        className="saved-problem-card"
                        onClick={() => loadSavedProblem(sp.id)}
                      >
                        <div className="saved-problem-header">
                          <h5>{p?.title || 'Untitled Problem'}</h5>
                          <button
                            className="btn-icon-small"
                            onClick={(e) => deleteSavedProblem(sp.id, e)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="saved-problem-meta">
                          <div className="saved-problem-meta-left">
                            <span className={`difficulty-badge difficulty-${p?.difficulty || 'basic'}`}>
                              {p?.difficulty || 'basic'}
                            </span>
                            <span className="saved-problem-topic">{p?.topic || 'General SQL'}</span>
                          </div>
                          <div className="saved-problem-meta-right">
                            {bestScore !== null && (
                              <div className="saved-problem-score">
                                <span className={`score-badge ${solved ? 'score-solved' : 'score-attempted'}`}>
                                  {solved ? <CheckCircle size={12} /> : <Target size={12} />}
                                  Best: {bestScore}/100
                                </span>
                                {attempts > 1 && (
                                  <span className="attempts-badge">{attempts} attempts</span>
                                )}
                              </div>
                            )}
                            <span className="saved-problem-date">{createdDate}</span>
                          </div>
                        </div>
                        <p className="saved-problem-description">
                          {(p?.description || '').substring(0, 100)}
                          {(p?.description || '').length > 100 ? '...' : ''}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Workspace View
  return (
    <div className="problems-page">
      <div className="problems-container">
        <div className="page-header">
          <h2>Problem-Solving Mode</h2>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setView('setup');
              setResult(null);
              setFeedback(null);
            }}
          >
            <ArrowLeft size={16} />
            Back to Problems
          </button>
        </div>

        {problem && (
          <div className="problem-workspace">
            <div className="problem-description">
              <div className="problem-header">
                <h3>{problem.title || 'Untitled Problem'}</h3>
                <span className={`difficulty-badge difficulty-${problem.difficulty || 'basic'}`}>
                  {problem.difficulty || 'basic'}
                </span>
              </div>
              <p>{problem.description || 'No description available'}</p>
              {problem.topic && (
                <div className="problem-topic">
                  <strong>Topic:</strong> <span>{problem.topic}</span>
                </div>
              )}
            </div>

            <div className="workspace-main">
              <div className="database-schema">
                <SchemaViewer onTablePreview={handleTablePreview} />
              </div>

              <div className="query-editor">
                <h4>Your SQL Query</h4>
                <textarea
                  id="sql-query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="-- Write your SQL query here...&#10;SELECT * FROM customers;"
                  rows={10}
                  disabled={executing}
                />
                <div className="editor-actions">
                  <div className="editor-actions-left">
                    <button
                      className="btn btn-primary"
                      onClick={executeQuery}
                      disabled={executing || !query.trim()}
                    >
                      <Play size={16} />
                      Run Query
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={clearQuery}
                      disabled={executing}
                    >
                      <X size={16} />
                      Clear
                    </button>
                  </div>
                  <button
                    className="btn btn-success"
                    onClick={checkAnswer}
                    disabled={executing || !query.trim() || !problem}
                  >
                    <CheckCircle size={16} />
                    Submit for Review
                  </button>
                </div>
              </div>
            </div>

            {result && (
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
            )}

            {feedback && (
              <div className={`feedback-panel ${feedback.correct ? 'success' : 'info'}`}>
                <div className="feedback-content">
                  <div className="feedback-header">
                    <h4>Feedback</h4>
                    <div className="feedback-score">Score: {feedback.score}/100</div>
                  </div>
                  {!showFeedbackDetails && (
                    <div className="feedback-summary">
                      <button
                        className="btn btn-secondary btn-view-feedback"
                        onClick={() => setShowFeedbackDetails(true)}
                      >
                        View Detailed Feedback
                      </button>
                    </div>
                  )}
                  {showFeedbackDetails && (
                    <div className="feedback-details">
                      <div className="feedback-message">{feedback.message}</div>
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
                      <button
                        className="btn btn-link btn-small"
                        onClick={() => setShowFeedbackDetails(false)}
                      >
                        Hide details
                      </button>
                    </div>
                  )}
                </div>
                <div className="feedback-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      setView('setup');
                      setResult(null);
                      setFeedback(null);
                      setQuery('');
                      setShowFeedbackDetails(false);
                    }}
                  >
                    Next Problem
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <TablePreviewModal
        tableName={previewTable}
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewTable(null);
        }}
      />
    </div>
  );
}
