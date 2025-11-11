import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import QuestionRenderer from '../components/Assessment/QuestionRenderer';
import ProgressBar from '../components/Assessment/ProgressBar';

export default function AssessmentTake() {
  const { userAssessmentId } = useParams();
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      navigate('/assessment');
      return;
    }

    fetchAssessment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session]);

  const fetchAssessment = async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-assessment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ assessmentId: 1 }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch assessment');
      }

      const data = await response.json();
      setQuestions(data.questions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assessment:', error);
      alert('Failed to load assessment. Please try again.');
      navigate('/assessment');
    }
  };

  const handleResponseSubmit = async (questionId, response, timeSpent) => {
    setSubmitting(true);

    try {
      const result = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-assessment-response`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userAssessmentId,
            questionId,
            response,
            timeSpentSeconds: timeSpent,
          }),
        }
      );

      if (!result.ok) {
        throw new Error('Failed to submit response');
      }

      const feedback = await result.json();

      setResponses((prev) => ({
        ...prev,
        [questionId]: { response, feedback },
      }));

      // Move to next question after showing feedback
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
          setSubmitting(false);
        } else {
          completeAssessment();
        }
      }, 2500);
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit answer. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSkip = async (questionId, timeSpent) => {
    setSubmitting(true);

    try {
      const result = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-assessment-response`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userAssessmentId,
            questionId,
            response: { skipped: true },
            timeSpentSeconds: timeSpent,
          }),
        }
      );

      if (!result.ok) {
        throw new Error('Failed to skip question');
      }

      const feedback = await result.json();

      setResponses((prev) => ({
        ...prev,
        [questionId]: { response: { skipped: true }, feedback },
      }));

      // Move to next question immediately
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
          setSubmitting(false);
        } else {
          completeAssessment();
        }
      }, 1000);
    } catch (error) {
      console.error('Error skipping question:', error);
      alert('Failed to skip question. Please try again.');
      setSubmitting(false);
    }
  };

  const completeAssessment = async () => {
    try {
      const totalTime = Math.floor((Date.now() - startTime) / 1000);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complete-assessment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userAssessmentId,
            timeSpentSeconds: totalTime,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to complete assessment');
      }

      navigate(`/assessment/results/${userAssessmentId}`);
    } catch (error) {
      console.error('Error completing assessment:', error);
      alert('Failed to complete assessment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading assessment...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="error-container">
        <h2>No questions available</h2>
        <p>Please contact support if this issue persists.</p>
        <button onClick={() => navigate('/assessment')} className="btn btn-primary">
          Back to Assessment
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="assessment-take">
      <div className="assessment-take-container">
        <ProgressBar current={currentQuestionIndex + 1} total={questions.length} />

        <div className="question-container">
          <QuestionRenderer
            question={currentQuestion}
            onSubmit={(response, timeSpent) =>
              handleResponseSubmit(currentQuestion.id, response, timeSpent)
            }
            onSkip={(timeSpent) =>
              handleSkip(currentQuestion.id, timeSpent)
            }
            feedback={responses[currentQuestion.id]?.feedback}
          />
        </div>

        <div className="navigation-hint">
          {submitting ? (
            <p>Submitting your answer...</p>
          ) : (
            <p>
              Question {currentQuestionIndex + 1} of {questions.length}
              {currentQuestionIndex === questions.length - 1 && ' (Final Question)'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
