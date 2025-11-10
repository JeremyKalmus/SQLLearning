import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing saved problems
 */
export function useSavedProblems(view) {
  const { user } = useAuth();
  const [savedProblems, setSavedProblems] = useState([]);
  const [loadingSavedProblems, setLoadingSavedProblems] = useState(false);

  useEffect(() => {
    if (view === 'setup' && user) {
      loadSavedProblems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, user]);

  const loadSavedProblems = async () => {
    try {
      setLoadingSavedProblems(true);
      
      // Fetch saved problems
      const { data: savedData, error: savedError } = await supabase
        .from('saved_problems')
        .select('id, problem_data, problem_id, current_query, current_notes, created_at, last_accessed')
        .eq('user_id', user.id)
        .order('last_accessed', { ascending: false })
        .limit(50);

      if (savedError) throw savedError;

      // For each saved problem, get best score and attempts from problem_history
      const problemsWithStats = await Promise.all(
        (savedData || []).map(async (sp) => {
          const problemData = sp.problem_data;
          const problemTitle = problemData?.title || '';

          // Get history for this problem
          const { data: historyData, error: historyError } = await supabase
            .from('problem_history')
            .select('score, correct')
            .eq('user_id', user.id)
            .eq('problem_title', problemTitle)
            .order('score', { ascending: false });

          if (historyError) {
            console.error('Error fetching history:', historyError);
            return {
              ...sp,
              problem: problemData,
              best_score: null,
              attempts: 0,
              solved: false,
            };
          }

          const attempts = historyData?.length || 0;
          const bestScore = historyData && historyData.length > 0 ? historyData[0].score : null;
          const solved = historyData?.some(h => h.correct) || false;

          return {
            ...sp,
            problem: problemData,
            best_score: bestScore,
            attempts: attempts,
            solved: solved,
          };
        })
      );

      setSavedProblems(problemsWithStats);
    } catch (error) {
      console.error('Error loading saved problems:', error);
    } finally {
      setLoadingSavedProblems(false);
    }
  };

  const loadSavedProblem = async (problemId) => {
    try {
      const { data, error } = await supabase
        .from('saved_problems')
        .select('problem_data, current_query, current_notes')
        .eq('id', problemId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Update last_accessed
      await supabase
        .from('saved_problems')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', problemId)
        .eq('user_id', user.id);

      return {
        problem: data.problem_data,
        savedQuery: data.current_query || '',
        savedNotes: data.current_notes || ''
      };
    } catch (error) {
      console.error('Error loading saved problem:', error);
      alert('Failed to load problem. Please try again.');
      throw error;
    }
  };

  const deleteSavedProblem = async (problemId) => {
    if (!confirm('Are you sure you want to delete this saved problem?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('saved_problems')
        .delete()
        .eq('id', problemId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      loadSavedProblems();
    } catch (error) {
      console.error('Error deleting problem:', error);
      alert('Failed to delete problem.');
    }
  };

  return {
    savedProblems,
    loadingSavedProblems,
    loadSavedProblems,
    loadSavedProblem,
    deleteSavedProblem
  };
}

