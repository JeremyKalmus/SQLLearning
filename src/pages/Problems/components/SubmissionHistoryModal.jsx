import { History, X, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { parsePraise } from '../../../utils/parsePraise';

export default function SubmissionHistoryModal({ problem, isOpen, onClose }) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState(null);

  useEffect(() => {
    if (isOpen && problem && user) {
      loadSubmissions();
    }
  }, [isOpen, problem, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSubmissions = async () => {
    try {
      setLoading(true);

      const problemTitle = problem.title;
      const problemId = problem.id;

      // Query by problem_title (which all records have) and optionally filter by problem_id
      // This handles both new records (with problem_id) and old records (without)
      const { data, error } = await supabase
        .from('problem_history')
        .select('id, query, score, correct, feedback_data, problem_id, problem_title, created_at')
        .eq('user_id', user.id)
        .eq('problem_title', problemTitle)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter to ensure we only get records for this specific problem
      // If problem_id exists, prefer records with matching problem_id, but also include null ones
      const filteredData = (data || []).filter(submission => {
        if (problemId) {
          // If we have a problem_id, include records that match it OR have null problem_id
          // (null problem_id means it's an old record before we started tracking problem_id)
          return submission.problem_id === problemId || submission.problem_id === null;
        }
        // If no problem_id, just match by title (all records should match)
        return true;
      });

      setSubmissions(filteredData);
    } catch (error) {
      console.error('Error loading submission history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (submissionId) => {
    setExpandedSubmission(expandedSubmission === submissionId ? null : submissionId);
  };

  const formatImprovement = (item) => {
    if (!item) return null;
    if (typeof item === 'string') return item.trim();
    if (typeof item === 'object') {
      const parts = [item.issue, item.explanation, item.solution]
        .filter(value => typeof value === 'string' && value.trim().length > 0)
        .map(value => value.trim());
      return parts.join(' — ') || JSON.stringify(item);
    }
    return String(item).trim();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen || !problem) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-history" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <History size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
            Submission History
          </h3>
          <button
            className="btn-icon-small"
            onClick={onClose}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="submission-history-loading">
              <div className="loading-spinner"></div>
              <p>Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="submission-history-empty">
              <p>No submissions yet. Submit your query to start tracking your progress!</p>
            </div>
          ) : (
            <div className="submission-history-list">
              <div className="submission-history-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Attempts:</span>
                  <span className="stat-value">{submissions.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Best Score:</span>
                  <span className="stat-value">{Math.max(...submissions.map(s => s.score))}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Solved:</span>
                  <span className="stat-value">
                    {submissions.some(s => s.correct) ? (
                      <span className="solved-badge">✓ Yes</span>
                    ) : (
                      <span className="not-solved-badge">✗ Not Yet</span>
                    )}
                  </span>
                </div>
              </div>

              {submissions.map((submission, index) => {
                const feedback = submission.feedback_data;
                const praiseItems = feedback?.praise ? parsePraise(feedback.praise) : [];
                const improvementItems = feedback?.improvements
                  ? (Array.isArray(feedback.improvements) ? feedback.improvements : [feedback.improvements])
                      .map(formatImprovement)
                      .filter(item => typeof item === 'string' && item.length > 0)
                  : [];
                const hasHighlights = praiseItems.length > 0 || improvementItems.length > 0;
                const feedbackHeadingId = `historical-feedback-${submission.id}`;

                return (
                <div key={submission.id} className="submission-item">
                  <div className="submission-header" onClick={() => toggleExpanded(submission.id)}>
                    <div className="submission-info">
                      <div className="submission-number">
                        Attempt #{submissions.length - index}
                      </div>
                      <div className="submission-date">{formatDate(submission.created_at)}</div>
                    </div>
                    <div className="submission-score-row">
                      <div className={`submission-score ${submission.correct ? 'correct' : 'incorrect'}`}>
                        {submission.correct ? (
                          <CheckCircle size={16} />
                        ) : (
                          <XCircle size={16} />
                        )}
                        <span>{submission.score}%</span>
                      </div>
                      <button className="btn-expand">
                        {expandedSubmission === submission.id ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedSubmission === submission.id && (
                    <div className="submission-details">
                      <div className="submission-query">
                        <h5>Your Query:</h5>
                        <pre><code>{submission.query}</code></pre>
                      </div>

                        {feedback && (
                        <div className="submission-feedback">
                            <div className={`feedback-panel ${feedback.correct ? 'success' : 'info'}`}>
                              <div className="feedback-content" role="region" aria-labelledby={feedbackHeadingId}>
                                <div className="feedback-header">
                                  <div className="feedback-header-left">
                                    <h4 id={feedbackHeadingId}>AI Feedback</h4>
                                    <span className={`feedback-status ${feedback.correct ? 'feedback-status-correct' : 'feedback-status-incorrect'}`}>
                                      {feedback.correct ? 'Looks Good' : 'Needs Work'}
                                    </span>
                                  </div>
                                  <div className="feedback-score">
                                    <span className="feedback-score-label">Score</span>
                                    <span className="feedback-score-value">{feedback.score ?? 0}</span>
                                  </div>
                                </div>

                                <div className="feedback-body">
                                  {feedback.message && (
                                    <p className="feedback-message">{feedback.message}</p>
                                  )}

                                  {hasHighlights && (
                                    <div className="feedback-highlights">
                                      {praiseItems.length > 0 && (
                                        <div className="feedback-column feedback-column-positive">
                                          <h5>What you did well</h5>
                                <ul>
                                  {praiseItems.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                                      )}
                                      {improvementItems.length > 0 && (
                                        <div className="feedback-column feedback-column-improve">
                                          <h5>Suggestions</h5>
                                <ul>
                                            {improvementItems.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

SubmissionHistoryModal.propTypes = {
  problem: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};
