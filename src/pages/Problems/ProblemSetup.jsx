import PropTypes from 'prop-types';
import SavedProblemsList from './components/SavedProblemsList';
import TopicFilter from './components/TopicFilter';
import SubDifficultySelector from './components/SubDifficultySelector';

/**
 * ProblemSetup component - Renders the setup view for problem generation
 * Includes difficulty selection, topic filtering, and saved problems list
 */
export default function ProblemSetup({ workspace }) {
  const {
    problemGen,
    savedProblems,
    executing,
    actions,
  } = workspace;

  return (
    <div className="problems-page">
      <div className="problems-container">
        <div className="page-header">
          <h1>Problem-Solving Mode</h1>
        </div>

        {!problemGen.hasApiKey && (
          <div className="alert alert-warning">
            <h3>API Key Required</h3>
            <p>You need to configure your Anthropic API key to use this feature.</p>
            <a href="/settings" className="btn btn-primary">Go to Settings</a>
          </div>
        )}

        <div className="problem-setup-grid">
          <div className="problem-setup-card">
            <h3>Generate New Problem</h3>
            <div className="setup-options">
              <div className="setup-row">
                <div className="option-group">
                  <label>Difficulty Tier:</label>
                  <select
                    value={problemGen.difficulty}
                    onChange={(e) => actions.handleDifficultyChange(e.target.value)}
                  >
                    <option value="basic">Basic - SELECT, WHERE, simple filtering</option>
                    <option value="intermediate">Intermediate - JOINs, GROUP BY, aggregates</option>
                    <option value="advanced">Advanced - Window functions, CTEs, subqueries</option>
                    <option value="expert">Expert - Recursive CTEs, complex analytics</option>
                  </select>
                </div>

                <TopicFilter
                  difficulty={problemGen.difficulty}
                  selectedTopic={problemGen.primaryTopic}
                  onTopicChange={problemGen.setPrimaryTopic}
                />
              </div>

              <SubDifficultySelector
                difficulty={problemGen.difficulty}
                selectedSubDifficulty={problemGen.subDifficulty}
                onSubDifficultyChange={problemGen.setSubDifficulty}
              />

              <button
                className="btn btn-primary btn-large"
                onClick={actions.handleGenerateProblem}
                disabled={executing || !problemGen.hasApiKey}
              >
                {executing
                  ? 'Generating...'
                  : `Generate New Problem${problemGen.primaryTopic ? ` (${problemGen.primaryTopic})` : ''}`
                }
              </button>
            </div>
          </div>

          <div className="saved-problems-card">
            <h3>Saved Problems</h3>
            <SavedProblemsList
              savedProblems={savedProblems.savedProblems}
              loadingSavedProblems={savedProblems.loadingSavedProblems}
              onLoadProblem={actions.loadSavedProblem}
              onDeleteProblem={savedProblems.deleteSavedProblem}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

ProblemSetup.propTypes = {
  workspace: PropTypes.shape({
    problemGen: PropTypes.shape({
      hasApiKey: PropTypes.bool.isRequired,
      difficulty: PropTypes.string.isRequired,
      primaryTopic: PropTypes.string,
      subDifficulty: PropTypes.string,
      setPrimaryTopic: PropTypes.func.isRequired,
      setSubDifficulty: PropTypes.func.isRequired,
    }).isRequired,
    savedProblems: PropTypes.shape({
      savedProblems: PropTypes.array.isRequired,
      loadingSavedProblems: PropTypes.bool.isRequired,
      deleteSavedProblem: PropTypes.func.isRequired,
    }).isRequired,
    executing: PropTypes.bool.isRequired,
    actions: PropTypes.shape({
      handleGenerateProblem: PropTypes.func.isRequired,
      loadSavedProblem: PropTypes.func.isRequired,
      handleDifficultyChange: PropTypes.func.isRequired,
    }).isRequired,
  }).isRequired,
};
