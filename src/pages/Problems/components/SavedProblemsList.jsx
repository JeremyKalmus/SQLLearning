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

    // Filter by difficulty (use normalized top-level difficulty column)
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(sp => {
        const difficultyValue = [
          sp.difficulty,
          sp.problem?.difficulty,
          sp.problem_data?.difficulty
        ]
          .find((value) => typeof value === 'string' && value.trim().length > 0);

        if (!difficultyValue) return false;

        const normalized = difficultyValue.trim().toLowerCase();

        if (normalized === difficultyFilter) return true;
        if (normalized.startsWith(`${difficultyFilter}-`)) return true;
        if (normalized.startsWith(`${difficultyFilter}+`)) return true;

        // Handle cases like "intermediate level" or "Intermediate problem"
        if (normalized.includes(' ')) {
          return normalized.split(' ')[0] === difficultyFilter;
        }

        return false;
      });
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
            const {
              id,
              problem: p,
              best_score: bestScore,
              attempts,
              solved,
              created_at: createdAt,
              difficulty_label: difficultyLabel,
              sub_difficulty: subDifficulty,
              primary_topic: primaryTopic
            } = sp;

            const displayTitle = p?.title || 'Untitled Problem';
            const createdDate = new Date(createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
            const normalizedDifficulty = (p?.difficulty || sp.difficulty || 'basic').toLowerCase();
            const difficultyText = subDifficulty || p?.display_difficulty || difficultyLabel || (p?.difficulty
              ? p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1)
              : 'Basic');
            const topicToShow = primaryTopic || p?.primary_topic || p?.topic || null;
            const attemptsCount = attempts || 0;
            const isSolved = solved || false;
            const scoreValue = bestScore !== null && bestScore !== undefined ? bestScore : null;

            return (
              <div
                key={id}
                className="saved-problem-card"
                onClick={() => onLoadProblem(id)}
              >
                <div className="saved-problem-header">
                  <h5>{displayTitle}</h5>
                  <button
                    className="btn-icon-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProblem(id);
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="saved-problem-meta">
                  <div className="saved-problem-meta-left">
                    <span className={`difficulty-badge difficulty-${normalizedDifficulty}`}>
                      {difficultyText}
                    </span>
                    {topicToShow && (
                      <span className="topic-badge">{topicToShow}</span>
                    )}
                  </div>
                  <div className="saved-problem-meta-right">
                    {scoreValue !== null && (
                      <div className="saved-problem-score">
                        <span className={`score-badge ${isSolved ? 'score-solved' : 'score-attempted'}`}>
                          {isSolved ? <CheckCircle size={12} /> : <Target size={12} />}
                          Best: {scoreValue}/100
                        </span>
                        {attemptsCount > 1 && (
                          <span className="attempts-badge">{attemptsCount} attempts</span>
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

