import { useProblemWorkspace } from './hooks/useProblemWorkspace';
import ProblemSetup from './ProblemSetup';
import ProblemWorkspace from './ProblemWorkspace';
import ProgressOverlay from './components/ProgressOverlay';

/**
 * Problems page - Main orchestrator component
 * Manages problem generation and solving workflow
 *
 * Refactored to use:
 * - useProblemWorkspace hook for state orchestration
 * - ProblemSetup component for setup view
 * - ProblemWorkspace component for workspace view
 */
export default function Problems() {
  // Get all workspace state and actions from centralized hook
  const workspace = useProblemWorkspace();

  // Show loading state while checking API key
  if (workspace.problemGen.loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      {/* Render appropriate view based on current state */}
      {workspace.view === 'setup' ? (
        <ProblemSetup workspace={workspace} />
      ) : (
        <ProblemWorkspace workspace={workspace} />
      )}

      {/* Progress overlay is shown on both views */}
      <ProgressOverlay
        showProgress={workspace.progress.showProgress}
        progress={workspace.progress.progress}
        progressMessage={workspace.progress.progressMessage}
      />
    </>
  );
}
