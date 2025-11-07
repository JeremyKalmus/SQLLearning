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

  const handleShowOptions = () => {
    if (options.length === 0) {
      const correctOption = { text: currentCard.answer, correct: true };
      const wrongOptions = [
        { text: 'Option A', correct: false },
        { text: 'Option B', correct: false },
        { text: 'Option C', correct: false }
      ];

      const allOptions = [correctOption, ...wrongOptions].sort(() => Math.random() - 0.5);
      setOptions(allOptions);
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
            <button className="btn-danger" onClick={() => handleMarkCorrect(false)}>
              Need More Practice
            </button>
            <button className="btn-secondary" onClick={handleShowOptions}>
              Test Me
            </button>
            <button className="btn-primary" onClick={() => handleMarkCorrect(true)}>
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
              <button className="btn-primary" onClick={handleNext}>
                Next Card
              </button>
            )}
          </div>
        )}

        <div className="navigation-buttons">
          <button
            className="btn-secondary"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            Previous
          </button>
          <button
            className="btn-secondary"
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
          >
            Next
          </button>
        </div>
      </div>

      <style jsx>{`
        .flashcards-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
        }

        .flashcards-container h1 {
          text-align: center;
          margin-bottom: 2rem;
        }

        .level-selector {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .level-btn {
          padding: 0.75rem 1.5rem;
          border: 2px solid var(--border);
          background: white;
          border-radius: var(--radius);
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .level-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .level-btn:hover:not(.active) {
          border-color: var(--primary);
        }

        .card-counter {
          text-align: center;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .flashcard {
          perspective: 1000px;
          cursor: pointer;
          margin-bottom: 2rem;
        }

        .flashcard-inner {
          position: relative;
          width: 100%;
          min-height: 400px;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }

        .flashcard.flipped .flashcard-inner {
          transform: rotateY(180deg);
        }

        .flashcard-front,
        .flashcard-back {
          position: absolute;
          width: 100%;
          min-height: 400px;
          backface-visibility: hidden;
          background: white;
          border-radius: var(--radius);
          box-shadow: var(--shadow-lg);
          padding: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .flashcard-back {
          transform: rotateY(180deg);
        }

        .card-topic {
          font-size: 0.875rem;
          color: var(--primary);
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .card-question {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text);
          text-align: center;
          margin-bottom: 2rem;
        }

        .flip-hint {
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-top: auto;
        }

        .card-answer {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--success);
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .card-explanation {
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .card-example {
          background: var(--background);
          padding: 1rem;
          border-radius: var(--radius);
          margin-top: 1rem;
        }

        .card-example strong {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--text);
        }

        .card-example pre {
          white-space: pre-wrap;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .card-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .options-container {
          background: white;
          padding: 2rem;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          margin-bottom: 2rem;
        }

        .options-container h3 {
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .option-btn {
          padding: 1rem;
          border: 2px solid var(--border);
          background: white;
          border-radius: var(--radius);
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .option-btn:hover:not(:disabled) {
          border-color: var(--primary);
        }

        .option-btn.correct {
          background: var(--success);
          color: white;
          border-color: var(--success);
        }

        .option-btn.incorrect {
          background: var(--danger);
          color: white;
          border-color: var(--danger);
        }

        .navigation-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .flashcard-front,
          .flashcard-back {
            padding: 2rem;
            min-height: 350px;
          }

          .card-question,
          .card-answer {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
}
