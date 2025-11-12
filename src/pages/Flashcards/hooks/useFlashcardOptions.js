import { useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Custom hook for managing flashcard multiple choice options
 * @param {Object} currentCard - Currently displayed flashcard
 * @param {string} selectedLevel - Current difficulty level
 * @param {Function} dispatch - Reducer dispatch function
 * @param {number} currentIndex - Current card index
 * @returns {Object} Options operations
 */
export function useFlashcardOptions(currentCard, selectedLevel, dispatch, currentIndex) {
  /**
   * Generate fallback options when AI generation fails
   * @param {string} correctAnswer - The correct answer
   * @returns {Array} Array of option objects
   */
  const generateFallbackOptions = useCallback((correctAnswer) => {
    const correctOption = { text: correctAnswer, correct: true };
    const wrongOptions = [
      { text: 'Option A', correct: false },
      { text: 'Option B', correct: false },
      { text: 'Option C', correct: false }
    ];
    return [correctOption, ...wrongOptions].sort(() => Math.random() - 0.5);
  }, []);

  /**
   * Load or generate options for current card
   */
  const loadOptionsForCard = useCallback(async () => {
    if (!currentCard) return;

    const cardIdToLoad = currentCard.id;

    dispatch({ type: 'SET_LOADING', loadingType: 'options', payload: true });

    try {
      // First, check if options are cached in database
      const { data: cachedData, error: cacheError } = await supabase
        .from('flashcard_options')
        .select('options')
        .eq('card_id', cardIdToLoad)
        .maybeSingle();

      // If cached options exist, use them
      if (!cacheError && cachedData?.options) {
        if (currentCard?.id === cardIdToLoad) {
          dispatch({ type: 'SET_OPTIONS', payload: cachedData.options });
        }
        dispatch({ type: 'SET_LOADING', loadingType: 'options', payload: false });
        return;
      }

      // Otherwise, generate new options via AI
      const { data, error } = await supabase.functions.invoke('generate-flashcard-options', {
        body: {
          card_id: cardIdToLoad,
          correct_answer: currentCard.answer,
          question: currentCard.question,
          topic: currentCard.topic,
          difficulty: currentCard.level || selectedLevel
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('API returned error:', data.error);
        throw new Error(data.error);
      }

      // Check if card is still current (user might have navigated away)
      if (currentCard?.id !== cardIdToLoad) {
        return;
      }

      // Use generated options if valid
      if (data?.options && Array.isArray(data.options) && data.options.length > 0) {
        dispatch({ type: 'SET_OPTIONS', payload: data.options });
      } else {
        // Use fallback options if generation failed
        const fallbackOptions = generateFallbackOptions(currentCard.answer);
        dispatch({ type: 'SET_OPTIONS', payload: fallbackOptions });
      }
    } catch (error) {
      // On error, use fallback options
      if (currentCard?.id === cardIdToLoad) {
        console.error('Error generating options:', error);
        const fallbackOptions = generateFallbackOptions(currentCard.answer);
        dispatch({ type: 'SET_OPTIONS', payload: fallbackOptions });
      }
    } finally {
      if (currentCard?.id === cardIdToLoad) {
        dispatch({ type: 'SET_LOADING', loadingType: 'options', payload: false });
      }
    }
  }, [currentCard, selectedLevel, dispatch, generateFallbackOptions]);

  /**
   * Reset card state and load options when card changes
   */
  useEffect(() => {
    // Reset card state
    dispatch({ type: 'RESET_CARD_STATE' });

    // Load options for new card
    if (currentCard) {
      loadOptionsForCard();
    }
  }, [currentIndex, currentCard, loadOptionsForCard, dispatch]);

  return {
    loadOptionsForCard
  };
}
