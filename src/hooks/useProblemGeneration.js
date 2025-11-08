import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing problem generation and API key checking
 */
export function useProblemGeneration(onProblemGenerated, onSavedProblemsReload) {
  const { user } = useAuth();
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [problem, setProblem] = useState(null);
  const [executing, setExecuting] = useState(false);

  const checkApiKey = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_api_keys')
      .select('encrypted_api_key')
      .eq('user_id', user.id)
      .maybeSingle();

    setHasApiKey(!!data?.encrypted_api_key);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      checkApiKey();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  const generateProblem = async (startProgress, completeProgress) => {
    if (!hasApiKey) {
      alert('Please configure your API key in Settings first');
      return;
    }

    setExecuting(true);
    setProblem(null);
    startProgress('Generating your problem...');

    try {
      const { data, error } = await supabase.functions.invoke('generate-problem', {
        body: { difficulty, user_id: user.id }
      });

      if (error) throw error;

      // Check if a problem with the same title already exists for this user
      const { data: existingProblems } = await supabase
        .from('saved_problems')
        .select('problem_data')
        .eq('user_id', user.id);

      // Only save if it's a new problem (different title)
      let isDuplicate = false;
      if (existingProblems && Array.isArray(existingProblems)) {
        isDuplicate = existingProblems.some((sp) => {
          return sp && sp.problem_data && sp.problem_data.title === data.title;
        });
      }

      if (!isDuplicate) {
        // Save the problem
        const { error: saveError } = await supabase
          .from('saved_problems')
          .insert({
            user_id: user.id,
            problem_data: data,
          });

        if (saveError) {
          console.error('Error saving problem:', saveError);
        }
      }

      completeProgress();
      setProblem(data);
      
      if (onProblemGenerated) {
        onProblemGenerated(data);
      }
      
      if (onSavedProblemsReload) {
        onSavedProblemsReload();
      }
    } catch (error) {
      console.error('Error generating problem:', error);
      alert('Failed to generate problem. Please check your API key and try again.');
      throw error;
    } finally {
      setExecuting(false);
    }
  };

  return {
    hasApiKey,
    loading,
    difficulty,
    setDifficulty,
    problem,
    setProblem,
    executing,
    generateProblem,
    checkApiKey
  };
}

