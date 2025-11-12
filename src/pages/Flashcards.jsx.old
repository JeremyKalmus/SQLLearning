import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Flashcards() {
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState('basic');
  const [cards, setCards] = useState([]);
  const [shuffledIndices, setShuffledIndices] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [options, setOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [cardProgress, setCardProgress] = useState(null);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [loadingCards, setLoadingCards] = useState(true);
  const [totalCardsInDb, setTotalCardsInDb] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Get current card using shuffled indices
  const currentCard = shuffledIndices.length > 0 && cards.length > 0 
    ? cards[shuffledIndices[currentIndex]] 
    : null;

  // Shuffle array helper
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Load flashcards from database
  const loadFlashcards = useCallback(async (level, offset = 0, limit = 5, updateLoadingState = true) => {
    try {
      if (updateLoadingState) {
        setLoadingCards(true);
      }
      
      // Get total count of cards in database for this level (only if updating state)
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
        setLoadingCards(false);
      }
    }
  }, []);

  // Load initial batch when level changes
  useEffect(() => {
    const fetchInitialCards = async () => {
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowOptions(false);
      setSelectedOption(null);
      setOptions([]);
      setCardProgress(null);
      
      const fetchedCards = await loadFlashcards(selectedLevel, 0, 5);
      setCards(fetchedCards);
      
      // Shuffle indices
      if (fetchedCards.length > 0) {
        const indices = shuffleArray(fetchedCards.map((_, i) => i));
        setShuffledIndices(indices);
      } else {
        setShuffledIndices([]);
      }
    };

    fetchInitialCards();
  }, [selectedLevel, loadFlashcards]);

  // Check if current batch is completed (all cards have times_correct > 0)
  const checkCurrentBatchCompletion = useCallback(async () => {
    if (!user || cards.length === 0) return false;

    const cardIds = cards.map(card => card.id);
    const { data: progressData } = await supabase
      .from('flashcard_progress')
      .select('card_id, times_correct')
      .eq('user_id', user.id)
      .in('card_id', cardIds);

    if (!progressData || progressData.length === 0) return false;

    const progressMap = new Map(progressData.map(p => [p.card_id, p.times_correct]));
    return cardIds.every(id => (progressMap.get(id) || 0) > 0);
  }, [user, cards]);

  // Check if all database cards for this level are completed
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

  // Load more cards from database
  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      // Get total count first
      const { count: totalCount } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('level', selectedLevel);
      
      setTotalCardsInDb(totalCount || 0);

      // Fetch next batch (don't update loading state, we use loadingMore)
      const nextBatch = await loadFlashcards(selectedLevel, cards.length, 5, false);
      if (nextBatch.length > 0) {
        const newCards = [...cards, ...nextBatch];
        setCards(newCards);
        
        // Re-shuffle all cards including new ones
        const indices = shuffleArray(newCards.map((_, i) => i));
        setShuffledIndices(indices);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error loading more cards:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [cards, selectedLevel, loadFlashcards]);

  // Generate new flashcards
  const handleGenerateFlashcards = useCallback(async () => {
    setGenerating(true);
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
      // Get updated total count
      const { count: totalCount } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('level', selectedLevel);
      
      setTotalCardsInDb(totalCount || 0);

      // Reload all cards (fetch all available)
      const fetchedCards = await loadFlashcards(selectedLevel, 0, totalCount || 1000, false);
      setCards(fetchedCards);
      
      // Re-shuffle
      if (fetchedCards.length > 0) {
        const indices = shuffleArray(fetchedCards.map((_, i) => i));
        setShuffledIndices(indices);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      alert('Failed to generate flashcards: ' + error.message);
    } finally {
      setGenerating(false);
    }
  }, [selectedLevel, cards.length, loadFlashcards]);

  // Check completion status and show appropriate UI
  const [batchCompleted, setBatchCompleted] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);

  useEffect(() => {
    const checkCompletion = async () => {
      if (!user || cards.length === 0) {
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
  }, [user, cards, checkCurrentBatchCompletion, checkAllDatabaseCardsCompleted]);

  const loadOptionsForCard = useCallback(async () => {
    if (!currentCard) return;
    
    const cardIdToLoad = currentCard.id;
    
    setLoadingOptions(true);
    try {
      const { data: cachedData, error: cacheError } = await supabase
        .from('flashcard_options')
        .select('options')
        .eq('card_id', cardIdToLoad)
        .maybeSingle();

      if (!cacheError && cachedData?.options) {
        if (currentCard?.id === cardIdToLoad) {
          setOptions(cachedData.options);
          setShowOptions(true);
        }
        setLoadingOptions(false);
        return;
      }

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
      
      if (currentCard?.id !== cardIdToLoad) {
        return;
      }
      
      if (data?.options && Array.isArray(data.options) && data.options.length > 0) {
        setOptions(data.options);
        setShowOptions(true);
      } else {
        const correctOption = { text: currentCard.answer, correct: true };
        const wrongOptions = [
          { text: 'Option A', correct: false },
          { text: 'Option B', correct: false },
          { text: 'Option C', correct: false }
        ];
        setOptions([correctOption, ...wrongOptions].sort(() => Math.random() - 0.5));
        setShowOptions(true);
      }
    } catch (error) {
      if (currentCard?.id === cardIdToLoad) {
        console.error('Error generating options:', error);
        const correctOption = { text: currentCard.answer, correct: true };
        const wrongOptions = [
          { text: 'Option A', correct: false },
          { text: 'Option B', correct: false },
          { text: 'Option C', correct: false }
        ];
        setOptions([correctOption, ...wrongOptions].sort(() => Math.random() - 0.5));
        setShowOptions(true);
      }
    } finally {
      if (currentCard?.id === cardIdToLoad) {
        setLoadingOptions(false);
      }
    }
  }, [currentCard, selectedLevel]);

  const loadCardProgress = useCallback(async () => {
    if (!currentCard || !user) return;
    
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

  useEffect(() => {
    setIsFlipped(false);
    setShowOptions(false);
    setSelectedOption(null);
    setOptions([]);
    setLoadingOptions(false);
    setCardProgress(null);
    
    if (currentCard && user) {
      loadCardProgress();
    }
    
    if (currentCard) {
      loadOptionsForCard();
    }
  }, [currentIndex, currentCard, loadOptionsForCard, loadCardProgress, user]);

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
  };

  const handleNext = () => {
    if (currentIndex < shuffledIndices.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleOptionSelect = async (option, index) => {
    if (selectedOption !== null && options[selectedOption]?.correct === false) {
      setSelectedOption(index);
      if (option.correct) {
        await updateProgress(true);
      }
      return;
    }
    
    if (selectedOption !== null && options[selectedOption]?.correct === true) {
      return;
    }

    setSelectedOption(index);
    await updateProgress(option.correct);
  };

  const updateProgress = async (isCorrect) => {
    if (!user || !currentCard) return;

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

    setCardProgress({ times_seen: newTimesSeen, times_correct: newTimesCorrect });

    setSessionStats(prev => ({
      reviewed: prev.reviewed + 1,
      correct: prev.correct + (isCorrect ? 1 : 0)
    }));

    await supabase.rpc('increment', {
      table_name: 'user_statistics',
      column_name: 'total_flashcards_reviewed',
      user_id: user.id
    }).catch(() => {
      supabase.from('user_statistics').update({
        total_flashcards_reviewed: supabase.raw('total_flashcards_reviewed + 1'),
        total_xp: supabase.raw(`total_xp + ${isCorrect ? 5 : 2}`),
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id);
    });

    // Re-check completion after progress update
    setTimeout(async () => {
      const batchDone = await checkCurrentBatchCompletion();
      setBatchCompleted(batchDone);
      if (batchDone) {
        const allDone = await checkAllDatabaseCardsCompleted();
        setAllCompleted(allDone);
      }
    }, 100);
  };

  if (loadingCards) {
    return (
      <div className="flashcards-page">
        <div className="flashcards-container">
          <h1>Loading flashcards...</h1>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="flashcards-page">
        <div className="flashcards-container">
          <h1>No flashcards available</h1>
          {batchCompleted && allCompleted && (
            <button 
              className="btn btn-primary" 
              onClick={handleGenerateFlashcards}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate 5 More Flashcards'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flashcards-page">
      <div className="flashcards-container">
        <h1>SQL Flashcards</h1>

        <div className="level-selector">
          <button
            className={`level-btn ${selectedLevel === 'basic' ? 'active' : ''}`}
            onClick={() => handleLevelChange('basic')}
          >
            Basic
          </button>
          <button
            className={`level-btn ${selectedLevel === 'intermediate' ? 'active' : ''}`}
            onClick={() => handleLevelChange('intermediate')}
          >
            Intermediate
          </button>
          <button
            className={`level-btn ${selectedLevel === 'advanced' ? 'active' : ''}`}
            onClick={() => handleLevelChange('advanced')}
          >
            Advanced
          </button>
          <button
            className={`level-btn ${selectedLevel === 'expert' ? 'active' : ''}`}
            onClick={() => handleLevelChange('expert')}
          >
            Expert
          </button>
        </div>

        <div className="card-counter">
          Card {currentIndex + 1} of {cards.length}
          {cardProgress && (
            <span className="card-progress-info">
              {' • '}
              Reviewed {cardProgress.times_seen} time{cardProgress.times_seen !== 1 ? 's' : ''}
              {cardProgress.times_seen > 0 && (
                <span className="accuracy-info">
                  {' • '}
                  {Math.round((cardProgress.times_correct / cardProgress.times_seen) * 100)}% correct
                </span>
              )}
            </span>
          )}
        </div>

        {sessionStats.reviewed > 0 && (
          <div className="session-stats">
            <span>Session: {sessionStats.reviewed} reviewed</span>
            <span className="session-accuracy">
              {Math.round((sessionStats.correct / sessionStats.reviewed) * 100)}% correct
            </span>
          </div>
        )}

        {batchCompleted && (
          <div className="completion-notice">
            {allCompleted ? (
              <div>
                <p>🎉 You've completed all available flashcards for this level!</p>
                <button 
                  className="btn btn-primary" 
                  onClick={handleGenerateFlashcards}
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Generate 5 More Flashcards'}
                </button>
              </div>
            ) : cards.length < totalCardsInDb ? (
              <div>
                <p>Great job! You've completed this batch.</p>
                <button 
                  className="btn btn-primary" 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More Cards'}
                </button>
              </div>
            ) : null}
          </div>
        )}

        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <div className="card-topic">{currentCard.topic}</div>
              <div className="card-question">{currentCard.question}</div>
              
              <div className="flashcard-options">
                {loadingOptions ? (
                  <div className="options-loading">Loading options...</div>
                ) : options.length === 0 ? (
                  <div className="options-error">No options available. Please try again.</div>
                ) : (
                  <>
                    <div className="options-list">
                      {options.map((option, index) => {
                        const isSelected = selectedOption === index;
                        const isCorrect = option.correct;
                        const wasWrongSelected = selectedOption !== null && options[selectedOption]?.correct === false;
                        const canSelect = selectedOption === null || (wasWrongSelected && !isSelected);
                        
                        return (
                          <button
                            key={index}
                            className={`option-btn ${
                              isSelected
                                ? isCorrect
                                  ? 'correct'
                                  : 'incorrect'
                                : ''
                            } ${!canSelect && !isSelected ? 'disabled' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canSelect) {
                                handleOptionSelect(option, index);
                              }
                            }}
                            disabled={!canSelect}
                          >
                            {option.text}
                            {isSelected && isCorrect && <span className="checkmark">✓</span>}
                            {isSelected && !isCorrect && <span className="crossmark">✗</span>}
                          </button>
                        );
                      })}
                    </div>
                    {selectedOption !== null && (
                      <div className="options-actions">
                        {options[selectedOption]?.correct === false && (
                          <button 
                            className="btn btn-secondary options-try-again-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOption(null);
                            }}
                          >
                            Try Again
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flashcard-back">
              <div className="card-topic">{currentCard.topic}</div>
              <div className="card-answer">{currentCard.answer}</div>
              <div className="card-explanation">{currentCard.explanation}</div>
              {currentCard.example && (
                <div className="card-example">
                  <strong>Example:</strong>
                  <pre>{currentCard.example}</pre>
                </div>
              )}
              <div className="flip-hint">Click to flip back</div>
            </div>
          </div>
        </div>

        <div className="navigation-buttons">
          <button
            className="btn btn-secondary"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            Previous
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleNext}
            disabled={currentIndex >= shuffledIndices.length - 1}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
