import { useState, useEffect } from 'react';
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

  const cards = flashcardsData[selectedLevel] || [];
  const currentCard = cards[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowOptions(false);
  }, [selectedLevel]);

  useEffect(() => {
    setIsFlipped(false);
    setShowOptions(false);
    setSelectedOption(null);
    setOptions([]);
  }, [currentIndex]);

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

  const handleShowOptions = async () => {
    if (options.length === 0) {
      try {
        // Generate options using AI
        const { data, error } = await supabase.functions.invoke('generate-flashcard-options', {
          body: {
            card_id: currentCard.id,
            correct_answer: currentCard.answer,
            question: currentCard.question,
            topic: currentCard.topic,
            difficulty: currentCard.level || selectedLevel
          }
        });

        if (error) throw error;
        
        if (data?.options) {
          setOptions(data.options);
        } else {
          // Fallback to simple options if AI generation fails
          const correctOption = { text: currentCard.answer, correct: true };
          const wrongOptions = [
            { text: 'Option A', correct: false },
            { text: 'Option B', correct: false },
            { text: 'Option C', correct: false }
          ];
          setOptions([correctOption, ...wrongOptions].sort(() => Math.random() - 0.5));
        }
      } catch (error) {
        console.error('Error generating options:', error);
        // Fallback to simple options
        const correctOption = { text: currentCard.answer, correct: true };
        const wrongOptions = [
          { text: 'Option A', correct: false },
          { text: 'Option B', correct: false },
          { text: 'Option C', correct: false }
        ];
        setOptions([correctOption, ...wrongOptions].sort(() => Math.random() - 0.5));
      }
    }
    setShowOptions(true);
  };

  const handleOptionSelect = async (option, index) => {
    setSelectedOption(index);

    await supabase.from('flashcard_progress').upsert({
      user_id: user.id,
      card_id: currentCard.id,
      times_seen: 1,
      times_correct: option.correct ? 1 : 0,
      last_seen: new Date().toISOString(),
      topic: currentCard.topic,
      level: currentCard.level
    }, {
      onConflict: 'user_id,card_id',
      ignoreDuplicates: false
    });

    await supabase.rpc('increment', {
      table_name: 'user_statistics',
      column_name: 'total_flashcards_reviewed',
      user_id: user.id
    }).catch(() => {
      supabase.from('user_statistics').update({
        total_flashcards_reviewed: supabase.raw('total_flashcards_reviewed + 1'),
        total_xp: supabase.raw(`total_xp + ${option.correct ? 5 : 2}`),
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
        </div>

        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <div className="card-topic">{currentCard.topic}</div>
              <div className="card-question">{currentCard.question}</div>
              <div className="flip-hint">Click to reveal answer</div>
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
            </div>
          </div>
        </div>

        {isFlipped && !showOptions && (
          <div className="card-actions">
            <button className="btn btn-danger" onClick={() => handleMarkCorrect(false)}>
              Need More Practice
            </button>
            <button className="btn btn-secondary" onClick={handleShowOptions}>
              Test Me
            </button>
            <button className="btn btn-primary" onClick={() => handleMarkCorrect(true)}>
              Got It!
            </button>
          </div>
        )}

        {showOptions && (
          <div className="options-container">
            <h3>Select the correct answer:</h3>
            <div className="options-grid">
              {options.map((option, index) => (
                <button
                  key={index}
                  className={`option-btn ${
                    selectedOption === index
                      ? option.correct
                        ? 'correct'
                        : 'incorrect'
                      : ''
                  }`}
                  onClick={() => handleOptionSelect(option, index)}
                  disabled={selectedOption !== null}
                >
                  {option.text}
                </button>
              ))}
            </div>
            {selectedOption !== null && (
              <button className="btn btn-primary" onClick={handleNext}>
                Next Card
              </button>
            )}
          </div>
        )}

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
