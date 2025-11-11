import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Trophy, Target, TrendingUp, BookOpen } from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function AssessmentResults() {
  const { userAssessmentId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    const { data, error } = await supabase
      .from('user_assessments')
      .select('*')
      .eq('id', userAssessmentId)
      .single();

    if (error) {
      console.error('Error fetching results:', error);
      alert('Failed to load results. Please try again.');
      navigate('/assessment');
      return;
    }

    setResults(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading results...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="error-container">
        <h2>Results not found</h2>
        <button onClick={() => navigate('/assessment')} className="btn btn-primary">
          Back to Assessment
        </button>
      </div>
    );
  }

  const skillScores = results.skill_scores || {};
  const skills = Object.keys(skillScores);
  const scores = Object.values(skillScores);

  const radarData = {
    labels: skills,
    datasets: [
      {
        label: 'Your Skill Level',
        data: scores,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };

  const radarOptions = {
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
        },
        pointLabels: {
          font: {
            size: 12,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
    maintainAspectRatio: true,
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-needs-work';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  const formatTutorialName = (slug) => {
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const recommendations = results.recommendations || {
    topicsToFocus: [],
    tutorialsToTake: [],
  };

  return (
    <div className="assessment-results">
      <div className="results-container">
        <header className="results-header">
          <Trophy size={48} className="trophy-icon" />
          <h1>Your SQL Skill Profile</h1>
          <div className="overall-score">
            <span className="score-value">{results.overall_score}</span>
            <span className="score-max">/100</span>
          </div>
          <p className="recommended-level">
            Recommended Level: <strong>{results.recommended_level || 'intermediate'}</strong>
          </p>
        </header>

        <div className="results-grid">
          <div className="radar-chart-card">
            <h2>
              <TrendingUp size={24} />
              Skills Overview
            </h2>
            <div className="radar-chart-wrapper">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>

          <div className="skill-breakdown-card">
            <h2>
              <Target size={24} />
              Detailed Scores
            </h2>
            <div className="skill-list">
              {Object.entries(skillScores)
                .sort((a, b) => b[1] - a[1])
                .map(([skill, score]) => (
                  <div key={skill} className="skill-item">
                    <div className="skill-header">
                      <span className="skill-name">{skill}</span>
                      <div className="skill-score-badge">
                        <span className={`score-label ${getScoreColor(score)}`}>
                          {getScoreLabel(score)}
                        </span>
                        <span className="score-value">{score}%</span>
                      </div>
                    </div>
                    <div className="skill-progress-bar">
                      <div
                        className={`skill-progress-fill ${getScoreColor(score)}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {(recommendations.topicsToFocus.length > 0 ||
          recommendations.tutorialsToTake.length > 0) && (
          <div className="recommendations-card">
            <h2>
              <BookOpen size={24} />
              Personalized Recommendations
            </h2>

            {recommendations.topicsToFocus.length > 0 && (
              <div className="recommendation-section">
                <h3>Focus on these topics:</h3>
                <div className="topics-list">
                  {recommendations.topicsToFocus.map((topic) => (
                    <span key={topic} className="topic-badge">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {recommendations.tutorialsToTake.length > 0 && (
              <div className="recommendation-section">
                <h3>Recommended Tutorials:</h3>
                <ul className="tutorials-list">
                  {recommendations.tutorialsToTake.map((tutorial) => (
                    <li key={tutorial}>
                      <button
                        onClick={() => navigate(`/learn/${tutorial}`)}
                        className="tutorial-link"
                      >
                        {formatTutorialName(tutorial)} →
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="recommendation-section">
              <h3>Start Practicing:</h3>
              <button
                onClick={() =>
                  navigate(`/problems?difficulty=${results.recommended_level || 'intermediate'}`)
                }
                className="btn btn-primary"
              >
                Practice {results.recommended_level || 'intermediate'} Problems
              </button>
            </div>
          </div>
        )}

        <div className="results-actions">
          <button onClick={() => navigate('/assessment')} className="btn btn-secondary">
            Retake Assessment
          </button>
          <button onClick={() => navigate('/problems')} className="btn btn-primary">
            Start Practicing
          </button>
        </div>
      </div>
    </div>
  );
}
