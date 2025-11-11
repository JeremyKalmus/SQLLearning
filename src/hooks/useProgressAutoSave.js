import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * Hook for auto-saving query and notes progress
 *
 * @param {Object} problem - Current problem data
 * @param {string} query - Current SQL query
 * @param {string} notes - Current notes
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 2000)
 */
export function useProgressAutoSave(problem, query, notes, debounceMs = 2000) {
  const { user } = useAuth();
  const timeoutRef = useRef(null);
  const savedProblemIdRef = useRef(null);

  const saveProgress = useCallback(async () => {
    if (!user || !problem) return;

    try {
      // Check if we already have a saved problem for this
      const problemId = problem.id || problem.title; // Use problem ID or title as unique identifier

      const { data: existing, error: fetchError } = await supabase
        .from('saved_problems')
        .select('id')
        .eq('user_id', user.id)
        .eq('problem_id', problemId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        // Update existing saved problem
        const { error: updateError } = await supabase
          .from('saved_problems')
          .update({
            current_query: query,
            current_notes: notes,
            last_accessed: new Date().toISOString()
          })
          .eq('id', existing.id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
        savedProblemIdRef.current = existing.id;
      } else {
        // Create new saved problem
        const normalizedDifficulty = typeof problem?.difficulty === 'string'
          ? problem.difficulty.trim().toLowerCase()
          : 'basic';
        const { data: newSaved, error: insertError } = await supabase
          .from('saved_problems')
          .insert({
            user_id: user.id,
            problem_id: problemId,
            problem_data: problem,
            difficulty: normalizedDifficulty,
            sub_difficulty: problem?.sub_difficulty || null,
            primary_topic: problem?.primary_topic || null,
            current_query: query,
            current_notes: notes,
            last_accessed: new Date().toISOString()
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        savedProblemIdRef.current = newSaved.id;
      }
    } catch (error) {
      console.error('Error auto-saving progress:', error);
      // Silently fail - don't interrupt user experience
    }
  }, [user, problem, query, notes]);

  // Debounced auto-save effect
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't save if there's no problem or user
    if (!user || !problem) return;

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      saveProgress();
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, notes, problem, user, debounceMs, saveProgress]);

  // Save on unmount (user leaving the page)
  useEffect(() => {
    return () => {
      if (user && problem && (query || notes)) {
        saveProgress();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    saveProgress, // Expose manual save function
    savedProblemId: savedProblemIdRef.current
  };
}
