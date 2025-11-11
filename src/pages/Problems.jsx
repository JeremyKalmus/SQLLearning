import { useState } from 'react';
import { ArrowLeft, Lightbulb, CheckCircle, History } from 'lucide-react';
import SchemaViewer from '../components/SchemaViewer';
import TablePreviewModal from '../components/TablePreviewModal';
import { useProgress } from '../hooks/useProgress';
import { useProblemGeneration } from '../hooks/useProblemGeneration';
import { useQueryExecution } from '../hooks/useQueryExecution';
import { useAnswerChecking } from '../hooks/useAnswerChecking';
import { useSavedProblems } from '../hooks/useSavedProblems';
import { useProgressAutoSave } from '../hooks/useProgressAutoSave';
import ProblemDescription from './Problems/components/ProblemDescription';
import QueryEditor from './Problems/components/QueryEditor';
import QueryResults from './Problems/components/QueryResults';
import FeedbackPanel from './Problems/components/FeedbackPanel';
import HintsModal from './Problems/components/HintsModal';
import SolutionModal from './Problems/components/SolutionModal';
import SubmissionHistoryModal from './Problems/components/SubmissionHistoryModal';
import SavedProblemsList from './Problems/components/SavedProblemsList';
import ProgressOverlay from './Problems/components/ProgressOverlay';
import Notepad from './Problems/components/Notepad';
import TopicFilter from './Problems/components/TopicFilter';
import SubDifficultySelector from './Problems/components/SubDifficultySelector';

export default function Problems() {
  const [view, setView] = useState('setup'); // 'setup' or 'workspace'
  const [previewTable, setPreviewTable] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [showHintsModal, setShowHintsModal] = useState(false);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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
    subDifficulty,
    setSubDifficulty,
    primaryTopic,
    setPrimaryTopic,
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
    checkAnswer: checkAnswerFromHook,
    resetFeedback
  } = useAnswerChecking();

  // Hints management - track which hints have been revealed
  const [hintsRevealed, setHintsRevealed] = useState(0);

  // Track number of submissions to control solution visibility
  const [submissionCount, setSubmissionCount] = useState(0);
  const [solutionUnlocked, setSolutionUnlocked] = useState(false);

  const handleHintRevealed = (hintNumber) => {
    setHintsRevealed(Math.max(hintsRevealed, hintNumber));
  };

  // Combined executing state
  const executing = generatingProblem || executingQuery || checkingAnswer;

  // Auto-save query and notes progress
  useProgressAutoSave(problem, query, notes);

  // Load saved problem handler
  const loadSavedProblem = async (problemId) => {
    try {
      const { problem: problemData, savedQuery, savedNotes } = await loadSavedProblemFromHook(problemId);
      setProblem(problemData);
      setQuery(savedQuery);
      setResult(null);
      setFeedback(null);
      setHintsRevealed(0);
      setSubmissionCount(0);
      setSolutionUnlocked(false);
      setNotes(savedNotes);
      setView('workspace');
    } catch (error) {
      // Error already handled in hook
    }
  };

  // Handle difficulty change
  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    // Reset sub-difficulty and topic when difficulty changes
    setSubDifficulty(null);
    setPrimaryTopic(null);
  };

  // Generate problem handler
  const handleGenerateProblem = async () => {
    try {
      await generateProblemFromHook(startProgress, completeProgress);
      setHintsRevealed(0);
      setSubmissionCount(0);
      setSolutionUnlocked(false);
    } catch (error) {
      setShowProgress(false);
    }
  };

  // Check answer handler
  const handleCheckAnswer = async () => {
    try {
      await checkAnswerFromHook(query, problem, startProgress, completeProgress, view, loadSavedProblems);
      setSubmissionCount(prev => prev + 1);
      setSolutionUnlocked(true);
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
    setSubmissionCount(0);
    setNotes('');
    setSolutionUnlocked(false);
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
                <label>Difficulty Tier:</label>
                <select value={difficulty} onChange={(e) => handleDifficultyChange(e.target.value)}>
                  <option value="basic">Basic - SELECT, WHERE, simple filtering</option>
                  <option value="intermediate">Intermediate - JOINs, GROUP BY, aggregates</option>
                  <option value="advanced">Advanced - Window functions, CTEs, subqueries</option>
                  <option value="expert">Expert - Recursive CTEs, complex analytics</option>
                </select>
              </div>

              <SubDifficultySelector
                difficulty={difficulty}
                selectedSubDifficulty={subDifficulty}
                onSubDifficultyChange={setSubDifficulty}
              />

              <TopicFilter
                difficulty={difficulty}
                selectedTopic={primaryTopic}
                onTopicChange={setPrimaryTopic}
              />

              <button
                className="btn btn-primary btn-large"
                onClick={handleGenerateProblem}
                disabled={executing || !hasApiKey}
              >
                {executing ? 'Generating...' : `Generate New Problem${primaryTopic ? ` (${primaryTopic})` : ''}`}
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
            <div className="workspace-row workspace-row-top">
              <ProblemDescription problem={problem} />
              <div className="workspace-schema-panel">
                <SchemaViewer onTablePreview={handleTablePreview} />
              </div>
            </div>

            <div className="workspace-row workspace-row-middle">
              <div className="workspace-query-panel">
                <QueryEditor
                  query={query}
                  setQuery={setQuery}
                  executing={executing}
                  problem={problem}
                  onExecuteQuery={executeQuery}
                  onClearQuery={handleClearQuery}
                  onCheckAnswer={handleCheckAnswer}
                  actions={
                    <div className="workspace-primary-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setShowHistoryModal(true)}
                      >
                        <History size={16} />
                        History
                      </button>
                      {problem?.hints && problem.hints.length > 0 && (
                        <button
                          className="btn btn-hint"
                          onClick={() => setShowHintsModal(true)}
                        >
                          <Lightbulb size={16} />
                          Hints
                        </button>
                      )}
                      {problem?.solution && (
                        <button
                          className="btn btn-success"
                          onClick={() => setShowSolutionModal(true)}
                        >
                          <CheckCircle size={16} />
                          Solution
                        </button>
                      )}
                    </div>
                  }
                />
                <QueryResults result={result} />
              </div>

              <div className="workspace-notes-panel">
                <Notepad notes={notes} setNotes={setNotes} />
              </div>
            </div>

            {feedback && (
              <div className="workspace-row workspace-row-bottom">
                <FeedbackPanel
                  feedback={feedback}
                  onNextProblem={handleNextProblem}
                />
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

      <HintsModal
        problemHints={problem?.hints || []}
        isOpen={showHintsModal}
        onClose={() => setShowHintsModal(false)}
        onHintRevealed={handleHintRevealed}
      />

      <SolutionModal
        solution={problem?.solution || ''}
        explanation={problem?.explanation}
        hasSubmitted={solutionUnlocked || submissionCount > 0}
        isOpen={showSolutionModal}
        onClose={() => setShowSolutionModal(false)}
      />

      <SubmissionHistoryModal
        problem={problem}
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      <ProgressOverlay
        showProgress={showProgress}
        progress={progress}
        progressMessage={progressMessage}
      />
    </div>
  );
}
