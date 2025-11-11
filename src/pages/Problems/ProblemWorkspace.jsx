import PropTypes from 'prop-types';
import { ArrowLeft, Lightbulb, CheckCircle, History } from 'lucide-react';
import SchemaViewer from '../../components/SchemaViewer';
import TablePreviewModal from '../../components/TablePreviewModal';
import ProblemDescription from './components/ProblemDescription';
import QueryEditor from './components/QueryEditor';
import QueryResults from './components/QueryResults';
import FeedbackPanel from './components/FeedbackPanel';
import HintsModal from './components/HintsModal';
import SolutionModal from './components/SolutionModal';
import SubmissionHistoryModal from './components/SubmissionHistoryModal';
import Notepad from './components/Notepad';

/**
 * ProblemWorkspace component - Renders the workspace view for problem solving
 * Includes problem description, schema viewer, query editor, notepad, and all modals
 */
export default function ProblemWorkspace({ workspace }) {
  const {
    problemGen,
    queryExec,
    answerCheck,
    notes,
    setNotes,
    modalStates,
    submissionCount,
    solutionUnlocked,
    executing,
    actions,
  } = workspace;

  const problem = problemGen.problem;

  return (
    <div className="problems-page">
      <div className="problems-container">
        <div className="page-header">
          <h2>Problem-Solving Mode</h2>
          <button
            className="btn btn-secondary"
            onClick={actions.handleBackToSetup}
          >
            <ArrowLeft size={16} />
            Back to Problems
          </button>
        </div>

        {problem && (
          <div className="problem-workspace">
            {/* Top Row: Problem Description and Schema Viewer */}
            <div className="workspace-row workspace-row-top">
              <ProblemDescription problem={problem} />
              <div className="workspace-schema-panel">
                <SchemaViewer onTablePreview={actions.handleTablePreview} />
              </div>
            </div>

            {/* Middle Row: Query Editor and Notepad */}
            <div className="workspace-row workspace-row-middle">
              <div className="workspace-query-panel">
                <QueryEditor
                  query={queryExec.query}
                  setQuery={queryExec.setQuery}
                  executing={executing}
                  problem={problem}
                  onExecuteQuery={queryExec.executeQuery}
                  onClearQuery={actions.handleClearQuery}
                  onCheckAnswer={actions.handleCheckAnswer}
                  actions={
                    <div className="workspace-primary-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => actions.openModal('history')}
                      >
                        <History size={16} />
                        History
                      </button>
                      {problem?.hints && problem.hints.length > 0 && (
                        <button
                          className="btn btn-hint"
                          onClick={() => actions.openModal('hints')}
                        >
                          <Lightbulb size={16} />
                          Hints
                        </button>
                      )}
                      {problem?.solution && (
                        <button
                          className="btn btn-success"
                          onClick={() => actions.openModal('solution')}
                        >
                          <CheckCircle size={16} />
                          Solution
                        </button>
                      )}
                    </div>
                  }
                />
                <QueryResults result={queryExec.result} />
              </div>

              <div className="workspace-notes-panel">
                <Notepad notes={notes} setNotes={setNotes} />
              </div>
            </div>

            {/* Bottom Row: Feedback Panel (conditional) */}
            {answerCheck.feedback && (
              <div className="workspace-row workspace-row-bottom">
                <FeedbackPanel
                  feedback={answerCheck.feedback}
                  onNextProblem={actions.handleNextProblem}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table Preview Modal */}
      <TablePreviewModal
        tableName={modalStates.preview}
        isOpen={modalStates.preview !== null}
        onClose={() => actions.closeModal('preview')}
      />

      {/* Hints Modal */}
      <HintsModal
        problemHints={problem?.hints || []}
        isOpen={modalStates.hints}
        onClose={() => actions.closeModal('hints')}
        onHintRevealed={actions.handleHintRevealed}
      />

      {/* Solution Modal */}
      <SolutionModal
        solution={problem?.solution || ''}
        explanation={problem?.explanation}
        hasSubmitted={solutionUnlocked || submissionCount > 0}
        isOpen={modalStates.solution}
        onClose={() => actions.closeModal('solution')}
      />

      {/* Submission History Modal */}
      <SubmissionHistoryModal
        problem={problem}
        isOpen={modalStates.history}
        onClose={() => actions.closeModal('history')}
      />
    </div>
  );
}

ProblemWorkspace.propTypes = {
  workspace: PropTypes.shape({
    problemGen: PropTypes.shape({
      problem: PropTypes.object,
    }).isRequired,
    queryExec: PropTypes.shape({
      query: PropTypes.string.isRequired,
      setQuery: PropTypes.func.isRequired,
      result: PropTypes.object,
      executeQuery: PropTypes.func.isRequired,
    }).isRequired,
    answerCheck: PropTypes.shape({
      feedback: PropTypes.object,
    }).isRequired,
    notes: PropTypes.string.isRequired,
    setNotes: PropTypes.func.isRequired,
    modalStates: PropTypes.shape({
      hints: PropTypes.bool.isRequired,
      solution: PropTypes.bool.isRequired,
      history: PropTypes.bool.isRequired,
      preview: PropTypes.string,
    }).isRequired,
    submissionCount: PropTypes.number.isRequired,
    solutionUnlocked: PropTypes.bool.isRequired,
    executing: PropTypes.bool.isRequired,
    actions: PropTypes.shape({
      handleBackToSetup: PropTypes.func.isRequired,
      handleTablePreview: PropTypes.func.isRequired,
      handleClearQuery: PropTypes.func.isRequired,
      handleCheckAnswer: PropTypes.func.isRequired,
      openModal: PropTypes.func.isRequired,
      closeModal: PropTypes.func.isRequired,
      handleNextProblem: PropTypes.func.isRequired,
      handleHintRevealed: PropTypes.func.isRequired,
    }).isRequired,
  }).isRequired,
};
