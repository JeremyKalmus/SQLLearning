import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Custom hook for managing flashcard progress tracking
 * @param {Object} currentCard - Currently displayed flashcard
 * @param {Object} user - Current authenticated user
 * @param {string} selectedLevel - Current difficulty level
 * @param {Function} dispatch - Reducer dispatch function
 * @param {Function} onProgressUpdate - Callback when progress is updated
 * @returns {Object} Progress state and operations
 */
export function useFlashcardProgress(currentCard, user, selectedLevel, dispatch, onProgressUpdate) {
  const [cardProgress, setCardProgress] = useState(null);

  /**
   * Load progress data for current card
   */
  const loadCardProgress = useCallback(async () => {
    if (!currentCard || !user) {
      setCardProgress(null);
      return;
    }

    const { data, error } = await supabase
      .from('flashcard_progress')
      .select('times_seen, times_correct')
      .eq('user_id', user.id)
      .eq('card_id', currentCard.id)
      .maybeSingle();

    if (!error && data) {
      setCardProgress(data);
    } else if (!error && !data) {
      setCardProgress(null);
    }
  }, [currentCard, user]);

  /**
   * Update progress when user answers a question
   * @param {boolean} isCorrect - Whether the answer was correct
   */
  const updateProgress = useCallback(async (isCorrect) => {
    if (!user || !currentCard) return;

    try {
      // Get existing progress
      const { data: existingProgress } = await supabase
        .from('flashcard_progress')
        .select('times_seen, times_correct')
        .eq('user_id', user.id)
        .eq('card_id', currentCard.id)
        .maybeSingle();

      const currentTimesSeen = existingProgress?.times_seen || 0;
      const currentTimesCorrect = existingProgress?.times_correct || 0;

      const newTimesSeen = currentTimesSeen + 1;
      const newTimesCorrect = isCorrect ? currentTimesCorrect + 1 : currentTimesCorrect;

      // Update progress in database
      await supabase.from('flashcard_progress').upsert({
        user_id: user.id,
        card_id: currentCard.id,
        times_seen: newTimesSeen,
        times_correct: newTimesCorrect,
        last_seen: new Date().toISOString(),
        topic: currentCard.topic,
        level: currentCard.level || selectedLevel
      }, {
        onConflict: 'user_id,card_id',
        ignoreDuplicates: false
      });

      // Update local state
      setCardProgress({ times_seen: newTimesSeen, times_correct: newTimesCorrect });

      // Update session statistics
      dispatch({ type: 'INCREMENT_STATS', correct: isCorrect });

      // Update user statistics
      await supabase.rpc('increment', {
        table_name: 'user_statistics',
        column_name: 'total_flashcards_reviewed',
        user_id: user.id
      }).catch(() => {
        // Fallback if RPC fails
        supabase.from('user_statistics').update({
          total_flashcards_reviewed: supabase.raw('total_flashcards_reviewed + 1'),
          total_xp: supabase.raw(`total_xp + ${isCorrect ? 5 : 2}`),
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id);
      });

      // Trigger callback to re-check completion status
      if (onProgressUpdate) {
        setTimeout(() => {
          onProgressUpdate();
        }, 100);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [user, currentCard, selectedLevel, dispatch, onProgressUpdate]);

  /**
   * Load progress when card changes
   */
  useEffect(() => {
    loadCardProgress();
  }, [loadCardProgress]);

  return {
    cardProgress,
    updateProgress,
    loadCardProgress
  };
}
