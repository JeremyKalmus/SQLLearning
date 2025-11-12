import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import {
  MultipleChoiceQuestion,
  WriteQueryQuestion,
  ReadQueryQuestion,
  FindErrorQuestion,
  FillBlankQuestion
} from './questionTypes';

// Map question types to their corresponding components
const QUESTION_COMPONENTS = {
  'multiple_choice': MultipleChoiceQuestion,
  'write_query': WriteQueryQuestion,
  'read_query': ReadQueryQuestion,
  'find_error': FindErrorQuestion,
  'fill_blank': FillBlankQuestion
};

export default function QuestionRenderer({ question, onSubmit, onSkip, feedback }) {
  const [answer, setAnswer] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [submitted, setSubmitted] = useState(false);

  const questionData = question.question_data;

  const handleSubmit = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    setSubmitted(true);
    onSubmit(answer, timeSpent);
  };

  const handleSkip = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    setSubmitted(true);
    if (onSkip) {
      onSkip(timeSpent);
    }
  };

  useEffect(() => {
    setSubmitted(false);
    setStartTime(Date.now());

    if (question.question_type === 'fill_blank') {
      const blanksLength = questionData?.blanks?.length || 0;
      setAnswer({ blanks: Array(blanksLength).fill('') });
    } else if (question.question_type === 'write_query') {
      setAnswer({ query: '' });
    } else if (question.question_type === 'find_error') {
      setAnswer({ fixedQuery: '' });
    } else {
      setAnswer(null);
    }
  }, [question, questionData]);

  const renderQuestion = () => {
    const QuestionComponent = QUESTION_COMPONENTS[question.question_type];

    if (!QuestionComponent) {
      return <div>Unknown question type: {question.question_type}</div>;
    }

    return (
      <QuestionComponent
        questionData={questionData}
        answer={answer}
        onAnswerChange={setAnswer}
        submitted={submitted}
      />
    );
  };

  return (
    <div className="question-renderer">
      <div className="question-header">
        <span className="question-type">
          {question.question_type.replace('_', ' ').toUpperCase()}
        </span>
        <span className="skill-category">{question.skill_category}</span>
      </div>

      {renderQuestion()}

      {!submitted && (
        <div className="question-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={handleSubmit}
            disabled={
              !answer ||
              (question.question_type === 'fill_blank' &&
                !(answer.blanks || []).every((blank) => typeof blank === 'string' && blank.trim().length > 0)) ||
              (question.question_type === 'write_query' &&
                !(answer.query || '').trim().length) ||
              (question.question_type === 'find_error' &&
                !(answer.fixedQuery || '').trim().length)
            }
            className="btn btn-primary submit-answer-btn"
          >
            Submit Answer
          </button>
          <button
            onClick={handleSkip}
            className="btn btn-secondary"
            style={{ 
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)'
            }}
          >
            Skip Question
          </button>
        </div>
      )}

      {submitted && (
        <div className={`feedback ${feedback?.feedback?.includes('skipped') ? 'neutral' : 'neutral'}`}>
          <div className="feedback-header">
            <CheckCircle size={20} />
            <strong>{feedback?.feedback?.includes('skipped') ? 'Question skipped' : 'Answer submitted'}</strong>
          </div>
          <p className="feedback-message">
            {feedback?.feedback || 'Your answer has been recorded. Continue to the next question.'}
          </p>
        </div>
      )}
    </div>
  );
}
