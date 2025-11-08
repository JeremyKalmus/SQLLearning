import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Target, Flame, Lightbulb, BookOpen, Code } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    loadStats();
    checkApiKey();
  }, [user]);

  const checkApiKey = async () => {
    const { data } = await supabase
      .from('user_api_keys')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    setHasApiKey(!!data);
  };

  const loadStats = async () => {
    const { data, error } = await supabase
      .from('user_statistics')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setStats(data);
    } else if (!error) {
      setStats({
        total_problems_attempted: 0,
        total_problems_solved: 0,
        total_flashcards_reviewed: 0,
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0
      });
    }

    setLoading(false);
  };

  const calculateLevel = (xp) => {
    return Math.floor(xp / 100) + 1;
  };

  const xpForNextLevel = (xp) => {
    const currentLevel = calculateLevel(xp);
    return currentLevel * 100 - xp;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your progress...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="welcome-section">
          <h1>Welcome back, {user.email.split('@')[0]}!</h1>
          <p>Continue your SQL learning journey</p>
        </div>

        {!hasApiKey && (
          <div className="alert alert-warning">
            <h3>⚠ API Key Required</h3>
            <p>
              To use AI-powered features, you need to configure your Anthropic API key.
            </p>
            <Link to="/settings" className="btn btn-primary">
              Configure API Key
            </Link>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Target size={40} />
            </div>
            <div className="stat-content">
              <h3>Level {calculateLevel(stats?.total_xp || 0)}</h3>
              <p>{xpForNextLevel(stats?.total_xp || 0)} XP to next level</p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${((stats?.total_xp || 0) % 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Flame size={40} />
            </div>
            <div className="stat-content">
              <h3>{stats?.current_streak || 0} Day Streak</h3>
              <p>Longest: {stats?.longest_streak || 0} days</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Lightbulb size={40} />
            </div>
            <div className="stat-content">
              <h3>{stats?.total_problems_solved || 0} Problems Solved</h3>
              <p>Out of {stats?.total_problems_attempted || 0} attempted</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <BookOpen size={40} />
            </div>
            <div className="stat-content">
              <h3>{stats?.total_flashcards_reviewed || 0} Flashcards</h3>
              <p>Reviewed</p>
            </div>
          </div>
        </div>

        <div className="actions-section">
          <h2>What would you like to do?</h2>
          <div className="action-cards">
            <Link to="/flashcards" className="action-card">
              <div className="action-icon">
                <BookOpen size={36} />
              </div>
              <h3>Practice Flashcards</h3>
              <p>Review SQL concepts and syntax</p>
            </Link>

            <Link to="/problems" className="action-card">
              <div className="action-icon">
                <Code size={36} />
              </div>
              <h3>Solve Problems</h3>
              <p>Practice with AI-generated SQL challenges</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
