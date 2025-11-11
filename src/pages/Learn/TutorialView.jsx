import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TutorialSection from './components/TutorialSection';
import TutorialProgress from './components/TutorialProgress';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

export default function TutorialView() {
  const { slug } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [tutorial, setTutorial] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug && session) {
      fetchTutorial();
    }
  }, [slug, session]);

  const fetchTutorial = async () => {
    try {
      const { data: tutorialData, error: tutorialError } = await supabase
        .from('tutorials')
        .select('*')
        .eq('slug', slug)
        .single();

      if (tutorialError) throw tutorialError;

      if (tutorialData) {
        setTutorial(tutorialData);
        await markTutorialStarted(tutorialData.id);
        await fetchUserProgress(tutorialData.id);
      }
    } catch (error) {
      console.error('Error fetching tutorial:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async (tutorialId) => {
    if (!session?.user) return;

    const { data: progress } = await supabase
      .from('tutorial_progress')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('tutorial_id', tutorialId)
      .maybeSingle();

    setUserProgress(progress || null);
  };

  const markTutorialStarted = async (tutorialId) => {
    if (!session?.user) return;

    await supabase.from('tutorial_progress').upsert({
      user_id: session.user.id,
      tutorial_id: tutorialId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      last_accessed: new Date().toISOString()
    }, { onConflict: 'user_id,tutorial_id' });
  };

  const handleSectionComplete = async (sectionIndex) => {
    // Update progress when a section is completed
    if (tutorial && session?.user) {
      await fetchUserProgress(tutorial.id);
    }
  };

  const handleCompleteTutorial = async () => {
    if (!tutorial || !session?.user) return;

    try {
      // Mark tutorial as completed
      await supabase.from('tutorial_progress').upsert({
        user_id: session.user.id,
        tutorial_id: tutorial.id,
        status: 'completed',
        completed_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      }, { onConflict: 'user_id,tutorial_id' });

      // Navigate back to tutorials page
      navigate('/learn');
    } catch (error) {
      console.error('Error completing tutorial:', error);
    }
  };

  if (loading) {
    return (
      <div className="problems-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading tutorial...</p>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="problems-page">
        <div className="problems-container">
          <div className="page-header">
            <h2>Tutorial Not Found</h2>
            <Link to="/learn" className="btn btn-secondary">
              <ArrowLeft size={16} />
              Back to Tutorials
            </Link>
          </div>
          <div className="alert alert-error">
            <p>The requested tutorial could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const sections = (tutorial.content?.sections || []).sort((a, b) => a.order - b.order);

  return (
    <div className="problems-page">
      <div className="problems-container">
        <div className="page-header">
          <div>
            <h2>{tutorial.title}</h2>
            <p className="page-subtitle">{tutorial.description}</p>
          </div>
          <Link to="/learn" className="btn btn-secondary">
            <ArrowLeft size={16} />
            Back to Tutorials
          </Link>
        </div>

        <div className="problem-workspace">
          <div className="workspace-row workspace-row-top" style={{ gridTemplateColumns: '1fr', display: 'grid' }}>
            <div className="problem-description" style={{ width: '100%', maxWidth: '100%' }}>
              <div className="description-header">
                <h3>Section {currentSection + 1} of {sections.length}</h3>
                <TutorialProgress
                  currentSection={currentSection}
                  totalSections={sections.length}
                  userProgress={userProgress}
                />
              </div>
              <div className="description-content">
                <TutorialSection
                  section={sections[currentSection]}
                  tutorialId={tutorial.id}
                  onComplete={() => handleSectionComplete(currentSection)}
                />
              </div>
            </div>
          </div>

          <div className="workspace-row workspace-row-bottom">
            <div className="workspace-primary-actions" style={{ justifyContent: 'center', gap: '1.5rem' }}>
              <button
                onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
                disabled={currentSection === 0}
                className="btn btn-secondary"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <div className="section-indicator" style={{ display: 'flex', alignItems: 'center' }}>
                Section {currentSection + 1} of {sections.length}
              </div>

              {currentSection === sections.length - 1 ? (
                <button
                  onClick={handleCompleteTutorial}
                  className="btn btn-success"
                >
                  <CheckCircle size={16} />
                  Complete Tutorial
                </button>
              ) : (
                <button
                  onClick={() => setCurrentSection(prev => Math.min(sections.length - 1, prev + 1))}
                  className="btn btn-primary"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

