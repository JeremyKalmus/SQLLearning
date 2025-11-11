import { useReducer, useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { flashcardReducer, initialState } from '../utils/flashcardReducer';

/**
 * Custom hook for managing flashcard deck state and operations
 * @param {string} selectedLevel - Current difficulty level
 * @param {Object} user - Current authenticated user
 * @returns {Object} Deck state and operations
 */
export function useFlashcardDeck(selectedLevel, user) {
  const [state, dispatch] = useReducer(flashcardReducer, initialState);
  const [totalCardsInDb, setTotalCardsInDb] = useState(0);
  const [batchCompleted, setBatchCompleted] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);

  /**
   * Load flashcards from database
   * @param {string} level - Difficulty level
   * @param {number} offset - Starting index
   * @param {number} limit - Number of cards to load
   * @param {boolean} updateLoadingState - Whether to update loading state
   * @returns {Array} Loaded flashcards
   */
  const loadFlashcards = useCallback(async (level, offset = 0, limit = 5, updateLoadingState = true) => {
    try {
      if (updateLoadingState) {
        dispatch({ type: 'SET_LOADING', loadingType: 'cards', payload: true });
      }

      // Get total count of cards in database for this level
      if (updateLoadingState) {
        const { count: totalCount } = await supabase
          .from('flashcards')
          .select('*', { count: 'exact', head: true })
          .eq('level', level);

        setTotalCardsInDb(totalCount || 0);
      }

      // Fetch cards (prioritize non-AI generated, then by created_at)
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('level', level)
        .order('is_ai_generated', { ascending: true })
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error loading flashcards:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error loading flashcards:', error);
      return [];
    } finally {
      if (updateLoadingState) {
        dispatch({ type: 'SET_LOADING', loadingType: 'cards', payload: false });
      }
    }
  }, []);

  /**
   * Check if current batch is completed (all cards have times_correct > 0)
   */
  const checkCurrentBatchCompletion = useCallback(async () => {
    if (!user || state.cards.length === 0) return false;

    const cardIds = state.cards.map(card => card.id);
    const { data: progressData } = await supabase
      .from('flashcard_progress')
      .select('card_id, times_correct')
      .eq('user_id', user.id)
      .in('card_id', cardIds);

    if (!progressData || progressData.length === 0) return false;

    const progressMap = new Map(progressData.map(p => [p.card_id, p.times_correct]));
    return cardIds.every(id => (progressMap.get(id) || 0) > 0);
  }, [user, state.cards]);

  /**
   * Check if all database cards for this level are completed
   */
  const checkAllDatabaseCardsCompleted = useCallback(async () => {
    if (!user) return false;

    const { data: allCards } = await supabase
      .from('flashcards')
      .select('id')
      .eq('level', selectedLevel);

    if (!allCards || allCards.length === 0) return false;

    const cardIds = allCards.map(card => card.id);
    const { data: progressData } = await supabase
      .from('flashcard_progress')
      .select('card_id, times_correct')
      .eq('user_id', user.id)
      .in('card_id', cardIds);

    if (!progressData) return false;

    const progressMap = new Map(progressData.map(p => [p.card_id, p.times_correct]));
    return cardIds.every(id => (progressMap.get(id) || 0) > 0);
  }, [user, selectedLevel]);

  /**
   * Load more cards from database
   */
  const loadMoreCards = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loadingType: 'more', payload: true });
    try {
      // Get updated total count
      const { count: totalCount } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('level', selectedLevel);

      setTotalCardsInDb(totalCount || 0);

      // Fetch next batch
      const nextBatch = await loadFlashcards(selectedLevel, state.cards.length, 5, false);
      if (nextBatch.length > 0) {
        dispatch({ type: 'ADD_CARDS', payload: nextBatch });
      }
    } catch (error) {
      console.error('Error loading more cards:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', loadingType: 'more', payload: false });
    }
  }, [state.cards.length, selectedLevel, loadFlashcards]);

  /**
   * Generate new flashcards using AI
   */
  const generateFlashcards = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loadingType: 'generating', payload: true });
    try {
      const { data, error } = await supabase.functions.invoke('generate-flashcard', {
        body: {
          level: selectedLevel,
          count: 5
        }
      });

      if (error) {
        console.error('Error generating flashcards:', error);
        alert('Failed to generate flashcards: ' + error.message);
        return;
      }

      if (data?.error) {
        console.error('Generation error:', data.error);
        alert('Failed to generate flashcards: ' + data.error);
        return;
      }

      // Reload cards to include newly generated ones
      const { count: totalCount } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('level', selectedLevel);

      setTotalCardsInDb(totalCount || 0);

      // Reload all cards
      const fetchedCards = await loadFlashcards(selectedLevel, 0, totalCount || 1000, false);
      dispatch({ type: 'SET_CARDS', payload: fetchedCards });
    } catch (error) {
      console.error('Error generating flashcards:', error);
      alert('Failed to generate flashcards: ' + error.message);
    } finally {
      dispatch({ type: 'SET_LOADING', loadingType: 'generating', payload: false });
    }
  }, [selectedLevel, loadFlashcards]);

  /**
   * Check completion status whenever cards or user changes
   */
  useEffect(() => {
    const checkCompletion = async () => {
      if (!user || state.cards.length === 0) {
        setBatchCompleted(false);
        setAllCompleted(false);
        return;
      }

      const batchDone = await checkCurrentBatchCompletion();
      setBatchCompleted(batchDone);

      if (batchDone) {
        const allDone = await checkAllDatabaseCardsCompleted();
        setAllCompleted(allDone);
      } else {
        setAllCompleted(false);
      }
    };

    checkCompletion();
  }, [user, state.cards, checkCurrentBatchCompletion, checkAllDatabaseCardsCompleted]);

  /**
   * Load initial batch when level changes
   */
  useEffect(() => {
    const fetchInitialCards = async () => {
      dispatch({ type: 'RESET_ALL' });
      const fetchedCards = await loadFlashcards(selectedLevel, 0, 5);
      dispatch({ type: 'SET_CARDS', payload: fetchedCards });
    };

    fetchInitialCards();
  }, [selectedLevel, loadFlashcards]);

  /**
   * Get current card using shuffled indices
   */
  const currentCard = state.shuffledIndices.length > 0 && state.cards.length > 0
    ? state.cards[state.shuffledIndices[state.currentIndex]]
    : null;

  return {
    state,
    dispatch,
    currentCard,
    totalCardsInDb,
    batchCompleted,
    allCompleted,
    loadMoreCards,
    generateFlashcards,
    checkCurrentBatchCompletion,
    checkAllDatabaseCardsCompleted
  };
}
