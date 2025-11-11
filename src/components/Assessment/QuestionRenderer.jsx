import { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, SQLDialect } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { CheckCircle } from 'lucide-react';

export default function QuestionRenderer({ question, onSubmit, feedback }) {
  const [answer, setAnswer] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [submitted, setSubmitted] = useState(false);

  const questionData = question.question_data;

  const handleSubmit = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    setSubmitted(true);
    onSubmit(answer, timeSpent);
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
    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <div className="question-multiple-choice">
            <h2>{questionData.question}</h2>
            {questionData.code && (
              <div className="question-code">
                <CodeMirror
                  value={questionData.code}
                  extensions={[sql({
                    dialect: SQLDialect.StandardSQL,
                    upperCaseKeywords: true
                  })]}
                  theme={oneDark}
                  editable={false}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: false,
                    highlightActiveLine: false,
                  }}
                  style={{
                    fontSize: '14px',
                    border: '2px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                />
              </div>
            )}
            <div className="options-list">
              {questionData.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-button ${
                    answer?.selectedOption === index ? 'selected' : ''
                  }`}
                  onClick={() => setAnswer({ selectedOption: index })}
                  disabled={submitted}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="option-text">{option}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'write_query':
        return (
          <div className="question-write-query">
            <h2>{questionData.question}</h2>
            <p className="question-description">{questionData.description}</p>
            <div className="code-editor">
              <CodeMirror
                value={answer?.query || ''}
                height="300px"
                extensions={[sql({
                  dialect: SQLDialect.StandardSQL,
                  upperCaseKeywords: true
                })]}
                theme={oneDark}
                onChange={(value) => setAnswer({ query: value })}
                placeholder="-- Write your SQL query here...\nSELECT * FROM table_name;"
                editable={!submitted}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  highlightActiveLine: true,
                  foldGutter: true,
                  dropCursor: true,
                  indentOnInput: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  highlightSelectionMatches: true,
                }}
                style={{
                  fontSize: '14px',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              />
            </div>
          </div>
        );

      case 'read_query':
        return (
          <div className="question-read-query">
            <h2>{questionData.question}</h2>
            <div className="query-to-read">
              <CodeMirror
                value={questionData.queryToRead}
                extensions={[sql({
                  dialect: SQLDialect.StandardSQL,
                  upperCaseKeywords: true
                })]}
                theme={oneDark}
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: false,
                  highlightActiveLine: false,
                }}
                style={{
                  fontSize: '14px',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              />
            </div>
            <p className="read-query-prompt">What does this query return?</p>
            <div className="options-list">
              {questionData.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-button ${
                    answer?.selectedOption === index ? 'selected' : ''
                  }`}
                  onClick={() => setAnswer({ selectedOption: index })}
                  disabled={submitted}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="option-text">{option}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'find_error':
        return (
          <div className="question-find-error">
            <h2>{questionData.question}</h2>
            <div className="broken-query">
              <h3>Broken Query:</h3>
              <CodeMirror
                value={questionData.brokenQuery}
                extensions={[sql({
                  dialect: SQLDialect.StandardSQL,
                  upperCaseKeywords: true
                })]}
                theme={oneDark}
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: false,
                  highlightActiveLine: false,
                }}
                style={{
                  fontSize: '14px',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              />
            </div>
            <div className="fix-query">
              <h3>Your Fix:</h3>
              <CodeMirror
                value={answer?.fixedQuery || ''}
                height="250px"
                extensions={[sql({
                  dialect: SQLDialect.StandardSQL,
                  upperCaseKeywords: true
                })]}
                theme={oneDark}
                onChange={(value) => setAnswer({ fixedQuery: value })}
                placeholder="-- Write the corrected query or describe the error..."
                editable={!submitted}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  highlightActiveLine: true,
                  foldGutter: true,
                  dropCursor: true,
                  indentOnInput: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  highlightSelectionMatches: true,
                }}
                style={{
                  fontSize: '14px',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              />
            </div>
          </div>
        );

      case 'fill_blank':
        return (
          <div className="question-fill-blank">
            <h2>{questionData.question}</h2>
            <div className="query-template">
              <pre>{questionData.queryTemplate}</pre>
            </div>
            <div className="blanks-input">
              {questionData.blanks.map((blank, index) => (
                <div key={index} className="blank-item">
                  <label>Blank {index + 1}:</label>
                  <input
                    type="text"
                    value={answer?.blanks?.[index] || ''}
                    onChange={(e) => {
                      const newBlanks = [...(answer?.blanks || [])];
                      newBlanks[index] = e.target.value;
                      setAnswer({ blanks: newBlanks });
                    }}
                    disabled={submitted}
                    className="blank-input"
                    placeholder="Enter keyword..."
                  />
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div>Unknown question type</div>;
    }
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
      )}

      {submitted && feedback && (
        <div className="feedback neutral">
          <div className="feedback-header">
            <CheckCircle size={20} />
            <strong>Answer submitted</strong>
          </div>
          {feedback.feedback && (
            <p className="feedback-message">{feedback.feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}
