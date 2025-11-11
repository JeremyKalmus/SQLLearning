import { useState } from 'react';
import { useProgress } from '../../../hooks/useProgress';
import { useProblemGeneration } from '../../../hooks/useProblemGeneration';
import { useQueryExecution } from '../../../hooks/useQueryExecution';
import { useAnswerChecking } from '../../../hooks/useAnswerChecking';
import { useSavedProblems } from '../../../hooks/useSavedProblems';
import { useProgressAutoSave } from '../../../hooks/useProgressAutoSave';

/**
 * Central hook for managing all problem workspace state and operations.
 * Orchestrates multiple hooks and provides a clean interface to components.
 */
export function useProblemWorkspace() {
  // View state
  const [view, setView] = useState('setup'); // 'setup' or 'workspace'
  const [notes, setNotes] = useState('');

  // Modal states
  const [modalStates, setModalStates] = useState({
    hints: false,
    solution: false,
    history: false,
    preview: null, // stores table name when preview is open
  });

  // Workspace tracking states
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [solutionUnlocked, setSolutionUnlocked] = useState(false);

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
  const savedProblems = useSavedProblems(view);

  // Problem generation callback
  const handleProblemGenerated = (newProblem) => {
    setView('workspace');
  };

  // Problem generation hook
  const problemGen = useProblemGeneration(
    handleProblemGenerated,
    savedProblems.loadSavedProblems
  );

  // Query execution hook
  const queryExec = useQueryExecution();

  // Answer checking hook
  const answerCheck = useAnswerChecking();

  // Combined executing state
  const executing = problemGen.executing || queryExec.executing || answerCheck.executing;

  // Auto-save query and notes progress
  useProgressAutoSave(problemGen.problem, queryExec.query, notes);

  // Modal management helpers
  const openModal = (modal, data = true) => {
    setModalStates(prev => ({
      ...prev,
      [modal]: data
    }));
  };

  const closeModal = (modal) => {
    setModalStates(prev => ({
      ...prev,
      [modal]: modal === 'preview' ? null : false
    }));
  };

  // Load saved problem handler
  const loadSavedProblem = async (problemId) => {
    try {
      const { problem: problemData, savedQuery, savedNotes } =
        await savedProblems.loadSavedProblem(problemId);

      problemGen.setProblem(problemData);
      queryExec.setQuery(savedQuery);
      queryExec.setResult(null);
      answerCheck.setFeedback(null);
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
    problemGen.setDifficulty(newDifficulty);
    // Reset sub-difficulty and topic when difficulty changes
    problemGen.setSubDifficulty(null);
    problemGen.setPrimaryTopic(null);
  };

  // Generate problem handler
  const handleGenerateProblem = async () => {
    try {
      await problemGen.generateProblem(startProgress, completeProgress);
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
      await answerCheck.checkAnswer(
        queryExec.query,
        problemGen.problem,
        startProgress,
        completeProgress,
        view,
        savedProblems.loadSavedProblems
      );
      setSubmissionCount(prev => prev + 1);
      setSolutionUnlocked(true);
    } catch (error) {
      setShowProgress(false);
    }
  };

  // Clear query handler (also clears feedback)
  const handleClearQuery = () => {
    queryExec.clearQuery();
    answerCheck.setFeedback(null);
  };

  // Handle table preview
  const handleTablePreview = (tableName) => {
    openModal('preview', tableName);
  };

  // Handle next problem
  const handleNextProblem = () => {
    setView('setup');
    queryExec.setResult(null);
    answerCheck.setFeedback(null);
    queryExec.setQuery('');
    setSubmissionCount(0);
    setNotes('');
    setSolutionUnlocked(false);
  };

  // Handle back to setup
  const handleBackToSetup = () => {
    setView('setup');
    queryExec.setResult(null);
    answerCheck.setFeedback(null);
  };

  // Handle hint revealed
  const handleHintRevealed = (hintNumber) => {
    setHintsRevealed(Math.max(hintsRevealed, hintNumber));
  };

  // Return organized state and actions
  return {
    // View state
    view,
    setView,

    // Notes state
    notes,
    setNotes,

    // Modal states
    modalStates,

    // Workspace tracking
    hintsRevealed,
    submissionCount,
    solutionUnlocked,

    // Executing state
    executing,

    // Progress state
    progress: {
      progress,
      progressMessage,
      showProgress,
    },

    // Actions
    actions: {
      // Modal actions
      openModal,
      closeModal,

      // Problem actions
      handleGenerateProblem,
      loadSavedProblem,
      handleNextProblem,
      handleBackToSetup,

      // Query actions
      handleCheckAnswer,
      handleClearQuery,

      // UI actions
      handleTablePreview,
      handleHintRevealed,
      handleDifficultyChange,
    },

    // Hook interfaces
    problemGen,
    queryExec,
    answerCheck,
    savedProblems,
  };
}
