import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing answer checking and feedback
 */
export function useAnswerChecking() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [showFeedbackDetails, setShowFeedbackDetails] = useState(false);

  const checkAnswer = async (query, problem, startProgress, completeProgress, view, onSavedProblemsReload) => {
    if (!query.trim() || !problem) {
      alert('Please enter a query and generate a problem first');
      return;
    }

    setExecuting(true);
    startProgress('Reviewing your query...');

    try {
      // Get user statistics before checking answer
      const { data: statsData } = await supabase
        .from('user_statistics')
        .select('total_problems_attempted, total_problems_solved, total_xp')
        .eq('user_id', user.id)
        .maybeSingle();

      const userLevel = statsData?.total_xp ? Math.floor(statsData.total_xp / 100) + 1 : 1;
      const problemsSolved = statsData?.total_problems_solved || 0;

      const { data, error } = await supabase.functions.invoke('check-answer', {
        body: {
          query,
          problem_description: problem.description,
          user_id: user.id,
          difficulty: problem.difficulty,
          topic: problem.topic,
          student_level: userLevel,
          problems_solved: problemsSolved
        }
      });

      if (error) throw error;

      completeProgress();
      setFeedback(data);
      setShowFeedbackDetails(false); // Reset to collapsed state

      // Ensure problem_id is set - generate it from title if not present
      const problemId = problem.id || problem.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      await supabase.from('problem_history').insert({
        user_id: user.id,
        problem_title: problem.title,
        problem_id: problemId,
        difficulty: problem.difficulty,
        topic: problem.topic,
        query,
        score: data.score || 0,
        correct: data.correct || false,
        feedback_data: data // Store the complete feedback object
      });

      // Update statistics using the statsData we already fetched
      if (statsData) {
        await supabase
          .from('user_statistics')
          .update({
            total_problems_attempted: (statsData.total_problems_attempted || 0) + 1,
            total_problems_solved: (statsData.total_problems_solved || 0) + (data.correct ? 1 : 0),
            total_xp: (statsData.total_xp || 0) + Math.floor((data.score || 0) / 5),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }

      // Reload saved problems to update scores
      if (view === 'setup' && onSavedProblemsReload) {
        onSavedProblemsReload();
      }
    } catch (error) {
      console.error('Error checking answer:', error);
      alert('Failed to check answer. Please try again.');
      throw error;
    } finally {
      setExecuting(false);
    }
  };

  const resetFeedback = () => {
    setFeedback(null);
    setShowFeedbackDetails(false);
  };

  return {
    feedback,
    setFeedback,
    executing,
    showFeedbackDetails,
    setShowFeedbackDetails,
    checkAnswer,
    resetFeedback
  };
}

