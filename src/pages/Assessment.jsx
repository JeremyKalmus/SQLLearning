import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BarChart3, Target, Clock, TrendingUp } from 'lucide-react';

export default function Assessment() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [lastAssessment, setLastAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAssessmentHistory();
  }, []);

  const checkAssessmentHistory = async () => {
    const { data } = await supabase
      .from('user_assessments')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setHasCompletedAssessment(true);
      setLastAssessment(data[0]);
    }

    setLoading(false);
  };

  const startAssessment = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/start-assessment`,
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
        throw new Error('Failed to start assessment');
      }

      const userAssessment = await response.json();
      navigate(`/assessment/take/${userAssessment.id}`);
    } catch (error) {
      console.error('Error starting assessment:', error);
      alert('Failed to start assessment. Please try again.');
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

  return (
    <div className="assessment-page">
      <div className="assessment-container">
        <header className="assessment-header">
          <h1>SQL Skill Assessment</h1>
          <p>Discover your SQL strengths and identify areas for improvement</p>
        </header>

        <div className="assessment-card">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <BarChart3 size={32} />
              </div>
              <h3>Comprehensive Analysis</h3>
              <p>Test 15+ SQL concepts from basic to expert</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <Target size={32} />
              </div>
              <h3>Personalized Insights</h3>
              <p>Get tailored recommendations for your learning path</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <TrendingUp size={32} />
              </div>
              <h3>Visual Progress</h3>
              <p>See your skills visualized in an interactive radar chart</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <Clock size={32} />
              </div>
              <h3>20 Minutes</h3>
              <p>Complete assessment with immediate results</p>
            </div>
          </div>

          {hasCompletedAssessment && lastAssessment && (
            <div className="previous-assessment">
              <h3>Previous Assessment</h3>
              <p className="assessment-date">
                Completed on {new Date(lastAssessment.completed_at).toLocaleDateString()}
              </p>
              <p className="assessment-score">
                Overall Score: <strong>{lastAssessment.overall_score}/100</strong>
              </p>
              <button
                onClick={() => navigate(`/assessment/results/${lastAssessment.id}`)}
                className="btn btn-secondary"
              >
                View Previous Results →
              </button>
            </div>
          )}

          <button
            onClick={startAssessment}
            className="btn btn-primary btn-large"
          >
            {hasCompletedAssessment ? 'Retake Assessment' : 'Start Assessment'}
          </button>

          <p className="assessment-note">
            Your progress is saved automatically. You can pause and resume anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
