// Flashcard manager - handles loading and navigation
const FlashcardManager = {
    async load() {
        try {
            FlashcardState.allFlashcards = await FlashcardsAPI.getAll();
            
            // Hide loading indicator
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Show card content
            document.getElementById('card-topic').style.display = 'block';
            document.getElementById('card-question').style.display = 'block';
            
            this.switchDifficulty('basic');
            Stats.load();
        } catch (error) {
            console.error('Error loading flashcards:', error);
            
            // Hide loading indicator
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Show error to user
            const optionsContainer = document.getElementById('multiple-choice-options');
            if (optionsContainer) {
                optionsContainer.style.display = 'block';
                optionsContainer.innerHTML = `<p style="color: red; padding: 20px; text-align: center;">Error loading flashcards: ${error.message}. Please check the console for details.</p>`;
            }
        }
    },

    switchDifficulty(difficulty) {
        FlashcardState.currentDifficulty = difficulty;
        FlashcardState.cards = FlashcardState.allFlashcards[difficulty] || [];
        FlashcardState.reset();

        // Update UI
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });

        document.getElementById('total-cards').textContent = FlashcardState.cards.length;
        FlashcardDisplay.show();
    },

    next() {
        // Only allow if correct answer was selected
        if (!FlashcardState.answerSelected) return;
        
        const card = FlashcardState.cards[FlashcardState.currentCardIndex];
        const correctOption = card.options?.find(opt => opt.correct);
        if (!correctOption) return;

        // Check if user selected the correct answer
        const selectedOption = card.options[FlashcardState.selectedOptionIndex];
        if (!selectedOption || !selectedOption.correct) {
            return; // Don't advance if wrong answer
        }

        if (FlashcardState.currentCardIndex < FlashcardState.cards.length - 1) {
            FlashcardState.currentCardIndex++;
            FlashcardDisplay.show();
        } else {
            alert('Congratulations! You completed all cards in this difficulty level!');
        }
    },

    previous() {
        if (FlashcardState.currentCardIndex > 0) {
            FlashcardState.currentCardIndex--;
            FlashcardDisplay.show();
        }
    }
};

// Make functions available globally
window.nextCard = () => FlashcardManager.next();
window.previousCard = () => FlashcardManager.previous();

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => FlashcardManager.switchDifficulty(btn.dataset.difficulty));
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' && !document.getElementById('next-btn').disabled) {
            FlashcardManager.next();
        }
        if (e.key === 'ArrowLeft' && !document.getElementById('prev-btn').disabled) {
            FlashcardManager.previous();
        }
        // Number keys 1-4 for selecting options
        if (e.key >= '1' && e.key <= '4' && !FlashcardState.answerSelected) {
            const optionIndex = parseInt(e.key) - 1;
            const optionButtons = document.querySelectorAll('.option-btn');
            if (optionButtons[optionIndex]) {
                optionButtons[optionIndex].click();
            }
        }
    });
});


