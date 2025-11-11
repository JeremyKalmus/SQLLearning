import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import TutorialCard from './Learn/components/TutorialCard';
import TutorialFilter from './Learn/components/TutorialFilter';

export default function Learn() {
  const { session } = useAuth();
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');

  useEffect(() => {
    fetchTutorials();
  }, [selectedDifficulty, selectedTopic, session]);

  const fetchTutorials = async () => {
    setLoading(true);

    try {
      // Query tutorials directly from Supabase
      let query = supabase
        .from('tutorials')
        .select('*')
        .order('order_index', { ascending: true });

      // Apply filters
      if (selectedDifficulty !== 'all') {
        query = query.eq('difficulty_tier', selectedDifficulty);
      }

      if (selectedTopic !== 'all') {
        query = query.eq('topic', selectedTopic);
      }

      const { data: tutorialsData, error: tutorialsError } = await query;

      if (tutorialsError) {
        console.error('Error fetching tutorials:', tutorialsError);
        // Check if table doesn't exist
        if (tutorialsError.message?.includes('does not exist') || tutorialsError.code === '42P01') {
          console.error('Tutorials table does not exist. Please run the migration: supabase/migrations/20250111_120002_create_tutorials.sql');
        }
        throw tutorialsError;
      }

      console.log(`Found ${tutorialsData?.length || 0} tutorials in database`);

      // Get user progress if authenticated
      let progressData = null;
      if (session?.user) {
        const { data: progress, error: progressError } = await supabase
          .from('tutorial_progress')
          .select('*')
          .eq('user_id', session.user.id);

        if (progressError) {
          console.error('Error fetching progress:', progressError);
        } else {
          progressData = progress;
        }
      }

      // Merge progress into tutorials
      const tutorialsWithProgress = (tutorialsData || []).map(tutorial => {
        const userProgress = progressData?.find(p => p.tutorial_id === tutorial.id);
        return {
          ...tutorial,
          userProgress: userProgress || { status: 'not_started' }
        };
      });

      console.log(`Loaded ${tutorialsWithProgress.length} tutorials`);
      setTutorials(tutorialsWithProgress);
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      setTutorials([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="welcome-section">
          <h1>Learn SQL Concepts</h1>
          <p>Master SQL through interactive tutorials and hands-on micro-challenges</p>
        </div>

        <TutorialFilter
          selectedDifficulty={selectedDifficulty}
          selectedTopic={selectedTopic}
          onDifficultyChange={setSelectedDifficulty}
          onTopicChange={setSelectedTopic}
        />

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading tutorials...</p>
          </div>
        ) : (
          (() => {
            const completedTutorials = tutorials.filter(t => t.userProgress?.status === 'completed');
            const notStartedTutorials = tutorials.filter(t => t.userProgress?.status !== 'completed');
            
            return (
              <>
                {/* Not Started Section */}
                {notStartedTutorials.length > 0 && (
                  <div style={{ marginTop: '32px', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-color)' }}>
                      Not Started
                    </h2>
                    <div className="action-cards">
                      {notStartedTutorials.map(tutorial => (
                        <TutorialCard
                          key={tutorial.id}
                          tutorial={tutorial}
                          userProgress={tutorial.userProgress}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Section */}
                {completedTutorials.length > 0 && (
                  <div style={{ marginTop: notStartedTutorials.length > 0 ? '32px' : '0' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-color)' }}>
                      Completed
                    </h2>
                    <div className="action-cards">
                      {completedTutorials.map(tutorial => (
                        <TutorialCard
                          key={tutorial.id}
                          tutorial={tutorial}
                          userProgress={tutorial.userProgress}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()
        )}

        {tutorials.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No tutorials found.</p>
            <div className="text-sm text-gray-400">
              {selectedDifficulty !== 'all' || selectedTopic !== 'all' ? (
                <p>Try adjusting your filters or check the browser console for errors.</p>
              ) : (
                <div>
                  <p className="mb-2">The tutorials table appears to be empty.</p>
                  <p>To seed tutorials, run:</p>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    node scripts/seed-tutorials.js
                  </code>
                  <p className="mt-2 text-xs">Make sure you've run the migration first: <code className="bg-gray-100 px-1 rounded">20250111_120002_create_tutorials.sql</code></p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

