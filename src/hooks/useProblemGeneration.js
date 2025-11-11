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
  const [subDifficulty, setSubDifficulty] = useState(null);
  const [primaryTopic, setPrimaryTopic] = useState(null);
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
        body: {
          difficulty,
          subDifficulty,
          primaryTopic,
          user_id: user.id
        }
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

      // Generate a unique problem ID based on title (normalized)
      const problemId = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Add the ID to the problem data
      const problemWithId = { ...data, id: problemId };

      if (!isDuplicate) {
        // Save the problem
        const { error: saveError } = await supabase
          .from('saved_problems')
          .insert({
            user_id: user.id,
            problem_id: problemId,
            problem_data: problemWithId,
            difficulty: difficulty,
            sub_difficulty: data.sub_difficulty || subDifficulty,
            primary_topic: data.primary_topic,
            secondary_topics: data.concept_tags || [],
            concept_tags: data.concept_tags || []
          });

        if (saveError) {
          console.error('Error saving problem:', saveError);
        }
      }

      completeProgress();
      setProblem(problemWithId);

      if (onProblemGenerated) {
        onProblemGenerated(problemWithId);
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
    subDifficulty,
    setSubDifficulty,
    primaryTopic,
    setPrimaryTopic,
    problem,
    setProblem,
    executing,
    generateProblem,
    checkApiKey
  };
}

