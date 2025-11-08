import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import flashcardsData from '../data/flashcards.json';

export default function Flashcards() {
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState('basic');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [options, setOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [cardProgress, setCardProgress] = useState(null);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });

  const cards = flashcardsData[selectedLevel] || [];
  const currentCard = cards[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowOptions(false);
  }, [selectedLevel]);

  const loadOptionsForCard = useCallback(async () => {
    if (!currentCard) return;
    
    // Store the card ID to check if card changed during async operation
    const cardIdToLoad = currentCard.id;
    
    setLoadingOptions(true);
    try {
      // First check if options are cached in the database
      const { data: cachedData, error: cacheError } = await supabase
        .from('flashcard_options')
        .select('options')
        .eq('card_id', cardIdToLoad)
        .maybeSingle();

      if (!cacheError && cachedData?.options) {
        // Use cached options - but only if card hasn't changed
        if (currentCard?.id === cardIdToLoad) {
          console.log('Using cached options for card:', cardIdToLoad);
          setOptions(cachedData.options);
          setShowOptions(true);
        }
        setLoadingOptions(false);
        return;
      }

      // If not cached, generate new options via API
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

      // Check if the response contains an error message
      if (data?.error) {
        console.error('API returned error:', data.error);
        throw new Error(data.error);
      }
      
      // Only set options if card hasn't changed during async operation
      if (currentCard?.id !== cardIdToLoad) {
        console.log('Card changed during load, ignoring options');
        return;
      }
      
      if (data?.options && Array.isArray(data.options) && data.options.length > 0) {
        console.log('Options received:', data.options);
        setOptions(data.options);
        setShowOptions(true);
      } else {
        console.warn('No valid options received, using fallback. Data:', data);
        // Fallback to simple options if AI generation fails
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
      // Only set fallback if card hasn't changed
      if (currentCard?.id === cardIdToLoad) {
        console.error('Error generating options:', error);
        // Fallback to simple options
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
      // Card hasn't been reviewed yet
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
    
    // Load progress for current card
    if (currentCard && user) {
      loadCardProgress();
    }
    
    // Automatically load options for the current card
    if (currentCard) {
      loadOptionsForCard();
    }
  }, [currentIndex, currentCard, loadOptionsForCard, loadCardProgress, user]);

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
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
    // Allow changing selection if wrong answer was selected
    if (selectedOption !== null && options[selectedOption]?.correct === false) {
      setSelectedOption(index);
      // Only update progress if selecting correct answer after wrong one
      if (option.correct) {
        await updateProgress(true);
      }
      return;
    }
    
    // Don't allow changing if correct answer was already selected
    if (selectedOption !== null && options[selectedOption]?.correct === true) {
      return;
    }

    setSelectedOption(index);
    await updateProgress(option.correct);
  };

  const updateProgress = async (isCorrect) => {
    if (!user || !currentCard) return;

    // Get current progress
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

    // Update flashcard progress
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

    // Update card progress state
    setCardProgress({ times_seen: newTimesSeen, times_correct: newTimesCorrect });

    // Update session stats
    setSessionStats(prev => ({
      reviewed: prev.reviewed + 1,
      correct: prev.correct + (isCorrect ? 1 : 0)
    }));

    // Update user statistics
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
  };

  const handleMarkCorrect = async (correct) => {
    await supabase.from('flashcard_progress').upsert({
      user_id: user.id,
      card_id: currentCard.id,
      times_seen: 1,
      times_correct: correct ? 1 : 0,
      last_seen: new Date().toISOString(),
      topic: currentCard.topic,
      level: currentCard.level
    }, {
      onConflict: 'user_id,card_id'
    });

    await supabase.from('user_statistics').update({
      total_flashcards_reviewed: supabase.raw('total_flashcards_reviewed + 1'),
      total_xp: supabase.raw(`total_xp + ${correct ? 5 : 2}`),
      updated_at: new Date().toISOString()
    }).eq('user_id', user.id);

    if (currentIndex < cards.length - 1) {
      handleNext();
    }
  };

  if (!currentCard) {
    return (
      <div className="flashcards-page">
        <div className="flashcards-container">
          <h1>No flashcards available</h1>
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
                        <button 
                          className="btn btn-primary options-next-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNext();
                          }}
                        >
                          Next Card
                        </button>
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
            disabled={currentIndex === cards.length - 1}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
