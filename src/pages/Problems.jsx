import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import SchemaViewer from '../components/SchemaViewer';
import TablePreviewModal from '../components/TablePreviewModal';
import { useProgress } from '../hooks/useProgress';
import { useProblemGeneration } from '../hooks/useProblemGeneration';
import { useQueryExecution } from '../hooks/useQueryExecution';
import { useAnswerChecking } from '../hooks/useAnswerChecking';
import { useHints } from '../hooks/useHints';
import { useSavedProblems } from '../hooks/useSavedProblems';
import ProblemDescription from './Problems/components/ProblemDescription';
import QueryEditor from './Problems/components/QueryEditor';
import QueryResults from './Problems/components/QueryResults';
import FeedbackPanel from './Problems/components/FeedbackPanel';
import HintsDisplay from './Problems/components/HintsDisplay';
import SavedProblemsList from './Problems/components/SavedProblemsList';
import ProgressOverlay from './Problems/components/ProgressOverlay';

export default function Problems() {
  const [view, setView] = useState('setup'); // 'setup' or 'workspace'
  const [previewTable, setPreviewTable] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Progress management
  const {
    progress,
    progressMessage,
    showProgress,
    startProgress,
    completeProgress,
    setShowProgress
  } = useProgress();

  // Saved problems management
  const {
    savedProblems,
    loadingSavedProblems,
    loadSavedProblems,
    loadSavedProblem: loadSavedProblemFromHook,
    deleteSavedProblem
  } = useSavedProblems(view);

  // Problem generation
  const handleProblemGenerated = (newProblem) => {
    setView('workspace');
  };

  const {
    hasApiKey,
    loading,
    difficulty,
    setDifficulty,
    problem,
    setProblem,
    executing: generatingProblem,
    generateProblem: generateProblemFromHook,
    checkApiKey
  } = useProblemGeneration(handleProblemGenerated, loadSavedProblems);

  // Query execution
  const {
    query,
    setQuery,
    result,
    setResult,
    executing: executingQuery,
    executeQuery,
    clearQuery
  } = useQueryExecution();

  // Answer checking
  const {
    feedback,
    setFeedback,
    executing: checkingAnswer,
    showFeedbackDetails,
    setShowFeedbackDetails,
    checkAnswer: checkAnswerFromHook,
    resetFeedback
  } = useAnswerChecking();

  // Hints management
  const { hintsUsed, hints, loadingHint, getHint, resetHints } = useHints(hasApiKey);

  // Combined executing state
  const executing = generatingProblem || executingQuery || checkingAnswer;

  // Load saved problem handler
  const loadSavedProblem = async (problemId) => {
    try {
      const problemData = await loadSavedProblemFromHook(problemId);
      setProblem(problemData);
      setQuery('');
      setResult(null);
      setFeedback(null);
      resetHints();
      setView('workspace');
    } catch (error) {
      // Error already handled in hook
    }
  };

  // Generate problem handler
  const handleGenerateProblem = async () => {
    try {
      await generateProblemFromHook(startProgress, completeProgress);
      resetHints();
    } catch (error) {
      setShowProgress(false);
    }
  };

  // Check answer handler
  const handleCheckAnswer = async () => {
    try {
      await checkAnswerFromHook(query, problem, startProgress, completeProgress, view, loadSavedProblems);
    } catch (error) {
      setShowProgress(false);
    }
  };

  // Clear query handler (also clears feedback)
  const handleClearQuery = () => {
    clearQuery();
    setFeedback(null);
  };

  // Handle table preview
  const handleTablePreview = (tableName) => {
    setPreviewTable(tableName);
    setShowPreviewModal(true);
  };

  // Handle next problem
  const handleNextProblem = () => {
    setView('setup');
    setResult(null);
    setFeedback(null);
    setQuery('');
    setShowFeedbackDetails(false);
  };

  // Handle toggle feedback details
  const handleToggleFeedbackDetails = () => {
    setShowFeedbackDetails(!showFeedbackDetails);
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
                onClick={handleGenerateProblem}
                disabled={executing || !hasApiKey}
              >
                {executing ? 'Generating...' : 'Generate New Problem'}
              </button>
            </div>

            <div className="saved-problems-section">
              <h4>Saved Problems</h4>
              <SavedProblemsList
                savedProblems={savedProblems}
                loadingSavedProblems={loadingSavedProblems}
                onLoadProblem={loadSavedProblem}
                onDeleteProblem={deleteSavedProblem}
              />
            </div>
          </div>
        </div>
        <ProgressOverlay
          showProgress={showProgress}
          progress={progress}
          progressMessage={progressMessage}
        />
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
            <ProblemDescription problem={problem} />

            <div className="workspace-main">
              <div className="database-schema">
                <SchemaViewer onTablePreview={handleTablePreview} />
              </div>

              <QueryEditor
                query={query}
                setQuery={setQuery}
                executing={executing}
                loadingHint={loadingHint}
                hintsUsed={hintsUsed}
                problem={problem}
                onExecuteQuery={executeQuery}
                onClearQuery={handleClearQuery}
                onGetHint={() => getHint(problem, query)}
                onCheckAnswer={handleCheckAnswer}
              />
            </div>

            <HintsDisplay hints={hints} hintsUsed={hintsUsed} />

            <QueryResults result={result} />

            <FeedbackPanel
              feedback={feedback}
              showFeedbackDetails={showFeedbackDetails}
              onToggleDetails={handleToggleFeedbackDetails}
              onNextProblem={handleNextProblem}
            />
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

      <ProgressOverlay
        showProgress={showProgress}
        progress={progress}
        progressMessage={progressMessage}
      />
    </div>
  );
}
