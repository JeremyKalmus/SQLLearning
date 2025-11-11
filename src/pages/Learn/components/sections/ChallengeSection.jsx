import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, SQLDialect } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { useAuth } from '../../../../contexts/AuthContext';
import { supabase } from '../../../../lib/supabase';
import PropTypes from 'prop-types';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';

export default function ChallengeSection({ content, tutorialId, onComplete }) {
  const { session } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [loadingChallenge, setLoadingChallenge] = useState(true);

  useEffect(() => {
    if (content.challengeId) {
      fetchChallenge();
    }
  }, [content.challengeId]);

  const fetchChallenge = async () => {
    try {
      const { data, error } = await supabase
        .from('micro_challenges')
        .select('*')
        .eq('id', content.challengeId)
        .single();

      if (error) throw error;
      setChallenge(data);
    } catch (error) {
      console.error('Error fetching challenge:', error);
    } finally {
      setLoadingChallenge(false);
    }
  };

  const handleSubmit = async () => {
    if (!query.trim() || !challenge) return;

    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-micro-challenge`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({
            challengeId: challenge.id,
            submittedQuery: query,
            tutorialId
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check challenge');
      }

      const result = await response.json();
      setFeedback(result);

      if (result.isCorrect && onComplete) {
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (error) {
      setFeedback({
        isCorrect: false,
        feedback: error.message,
        score: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingChallenge) {
    return <div className="text-center py-4">Loading challenge...</div>;
  }

  if (!challenge) {
    return <div className="text-center py-4 text-red-500">Challenge not found</div>;
  }

  return (
    <div className="challenge-section">
      <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '1rem' }}>{challenge.title}</h4>
        <p style={{ margin: 0, lineHeight: '1.6' }}>{challenge.description}</p>
      </div>

      <div className="code-editor" style={{ marginBottom: '1.5rem' }}>
        <CodeMirror
          value={query}
          height="250px"
          extensions={[sql({ dialect: SQLDialect.StandardSQL })]}
          theme={oneDark}
          onChange={(value) => setQuery(value)}
          placeholder="-- Write your SQL query here..."
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            autocompletion: true,
          }}
        />
      </div>

      <div className="actions" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <button
          onClick={handleSubmit}
          disabled={loading || !query.trim()}
          className="btn btn-success"
        >
          {loading ? 'Checking...' : 'Submit Answer'}
        </button>

        {challenge.hints && challenge.hints.length > 0 && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="btn btn-warning"
          >
            <Lightbulb size={16} />
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </button>
        )}
      </div>

      {showHint && challenge.hints && challenge.hints.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Lightbulb size={16} />
            Hint:
          </strong>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', margin: 0, lineHeight: '1.6' }}>
            {challenge.hints.map((hint, idx) => (
              <li key={idx} style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{hint}</li>
            ))}
          </ul>
        </div>
      )}

      {feedback && (
        <div
          className={feedback.isCorrect ? 'alert alert-success' : 'alert alert-error'}
          style={{ marginTop: '1rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            {feedback.isCorrect ? (
              <CheckCircle size={20} style={{ marginRight: '0.5rem' }} />
            ) : (
              <XCircle size={20} style={{ marginRight: '0.5rem' }} />
            )}
            <strong>
              {feedback.isCorrect ? 'Correct!' : 'Not quite right'}
            </strong>
          </div>
          <p style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>{feedback.feedback}</p>
          {feedback.score !== undefined && (
            <div style={{ fontSize: '0.875rem', fontWeight: '500', marginTop: '0.5rem' }}>
              Score: {feedback.score}/100
            </div>
          )}
          {feedback.hint && !feedback.isCorrect && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
              <strong>Hint:</strong> {feedback.hint}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

ChallengeSection.propTypes = {
  content: PropTypes.object.isRequired,
  tutorialId: PropTypes.number.isRequired,
  onComplete: PropTypes.func
};

