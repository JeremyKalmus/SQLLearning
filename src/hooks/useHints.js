import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing hints
 */
export function useHints(hasApiKey) {
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hints, setHints] = useState([]);
  const [loadingHint, setLoadingHint] = useState(false);

  const getHint = async (problem, query) => {
    if (!problem) {
      alert('Please generate a problem first');
      return;
    }

    if (hintsUsed >= 3) {
      alert('You have used all available hints!');
      return;
    }

    if (!hasApiKey) {
      alert('Please configure your API key in Settings first');
      return;
    }

    setLoadingHint(true);
    const nextHintLevel = hintsUsed + 1;

    try {
      const { data, error } = await supabase.functions.invoke('generate-hint', {
        body: {
          problem_description: problem.description,
          query: query,
          hint_level: nextHintLevel,
          difficulty: problem.difficulty,
          topic: problem.topic
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      const newHint = data.hint;
      setHints(prev => [...prev, { level: nextHintLevel, text: newHint }]);
      setHintsUsed(nextHintLevel);
    } catch (error) {
      console.error('Error getting hint:', error);
      alert('Failed to get hint. Please try again.');
    } finally {
      setLoadingHint(false);
    }
  };

  const resetHints = () => {
    setHintsUsed(0);
    setHints([]);
  };

  return {
    hintsUsed,
    hints,
    loadingHint,
    getHint,
    resetHints
  };
}

