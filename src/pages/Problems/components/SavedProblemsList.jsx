import { CheckCircle, Target, Trash2, Filter } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';

export default function SavedProblemsList({
  savedProblems,
  loadingSavedProblems,
  onLoadProblem,
  onDeleteProblem
}) {
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  // Apply filters and sorting
  const filteredAndSortedProblems = useMemo(() => {
    let filtered = [...savedProblems];

    // Filter by difficulty (use top-level difficulty column, not problem.difficulty)
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(sp => sp.difficulty === difficultyFilter);
    }

    // Filter by status (solved vs unsolved)
    if (statusFilter === 'solved') {
      filtered = filtered.filter(sp => sp.solved === true);
    } else if (statusFilter === 'unsolved') {
      filtered = filtered.filter(sp => !sp.solved);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'date-asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'score-desc':
          return (b.best_score || 0) - (a.best_score || 0);
        case 'score-asc':
          return (a.best_score || 0) - (b.best_score || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [savedProblems, difficultyFilter, statusFilter, sortBy]);

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
    <div className="saved-problems-container">
      <div className="saved-problems-filters">
        <div className="filter-group">
          <label htmlFor="difficulty-filter">
            <Filter size={14} />
            Difficulty:
          </label>
          <select
            id="difficulty-filter"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="basic">Basic</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="solved">Solved</option>
            <option value="unsolved">Unsolved</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sort-by">Sort by:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="score-desc">Highest Score</option>
            <option value="score-asc">Lowest Score</option>
          </select>
        </div>
      </div>

      {filteredAndSortedProblems.length === 0 ? (
        <div className="no-problems-text">
          No problems match your filters.
        </div>
      ) : (
        <div className="saved-problems-list">
          {filteredAndSortedProblems.map((sp) => {
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
      )}
    </div>
  );
}

SavedProblemsList.propTypes = {
  savedProblems: PropTypes.array.isRequired,
  loadingSavedProblems: PropTypes.bool.isRequired,
  onLoadProblem: PropTypes.func.isRequired,
  onDeleteProblem: PropTypes.func.isRequired
};

