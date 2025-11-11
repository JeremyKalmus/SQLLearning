import { CheckCircle, Target, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';

export default function SavedProblemsList({ 
  savedProblems, 
  loadingSavedProblems, 
  onLoadProblem, 
  onDeleteProblem 
}) {
  if (loadingSavedProblems) {
    return <div className="loading-text">Loading saved problems...</div>;
  }

  if (savedProblems.length === 0) {
    return (
      <div className="no-problems-text">
        No saved problems yet. Generate a problem to get started!
      </div>
    );
  }

  return (
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
            onClick={() => onLoadProblem(sp.id)}
          >
            <div className="saved-problem-header">
              <h5>{p?.title || 'Untitled Problem'}</h5>
              <button
                className="btn-icon-small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProblem(sp.id);
                }}
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="saved-problem-meta">
              <div className="saved-problem-meta-left">
                <span className={`difficulty-badge difficulty-${(p?.difficulty || 'basic').toLowerCase()}`}>
                  {p?.sub_difficulty || p?.difficulty || 'basic'}
                </span>
                {p?.primary_topic && (
                  <span className="topic-badge">{p.primary_topic}</span>
                )}
                {!p?.primary_topic && p?.topic && (
                  <span className="saved-problem-topic">{p.topic}</span>
                )}
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
          </div>
        );
      })}
    </div>
  );
}

SavedProblemsList.propTypes = {
  savedProblems: PropTypes.array.isRequired,
  loadingSavedProblems: PropTypes.bool.isRequired,
  onLoadProblem: PropTypes.func.isRequired,
  onDeleteProblem: PropTypes.func.isRequired
};

