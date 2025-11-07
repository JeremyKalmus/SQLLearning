// Flashcard display - handles card rendering and options
const FlashcardDisplay = {
    async show() {
        if (FlashcardState.cards.length === 0) {
            console.log('No cards available');
            return;
        }

        const card = FlashcardState.cards[FlashcardState.currentCardIndex];
        
        document.getElementById('current-card').textContent = FlashcardState.currentCardIndex + 1;

        // Reset state
        FlashcardState.answerSelected = false;
        FlashcardState.selectedOptionIndex = null;
        document.getElementById('next-btn').disabled = true;
        document.getElementById('card-feedback').style.display = 'none';

        // Display topic and question
        document.getElementById('card-topic').textContent = card.topic || 'No topic';
        document.getElementById('card-question').textContent = card.question || 'No question';

        // Show loading for options
        const optionsContainer = document.getElementById('multiple-choice-options');
        optionsContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Generating options...</p>';
        optionsContainer.style.display = 'block';

        // Check if options exist and are not fallback options
        const hasFallbackOptions = card.options && card.options.length === 4 && 
            card.options.some(opt => opt.text && opt.text.startsWith('Incorrect option'));
        
        if (card.options && card.options.length === 4 && !hasFallbackOptions) {
            // Options already loaded, use them
            this.displayOptions(card.options);
        } else {
            // Need to generate options
            try {
                // Remove existing options before sending (so backend generates new ones)
                const cardToSend = {...card};
                delete cardToSend.options;
                
                const options = await FlashcardsAPI.getOptions(cardToSend);
                
                // Cache the options in the card (in-memory for this session)
                card.options = options;
                
                this.displayOptions(options);
            } catch (error) {
                console.error('Error generating options:', error);
                optionsContainer.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">Error generating options: ${error.message}</p>`;
            }
        }

        // Update navigation buttons
        document.getElementById('prev-btn').disabled = FlashcardState.currentCardIndex === 0;
    },

    displayOptions(options) {
        const optionsContainer = document.getElementById('multiple-choice-options');
        optionsContainer.innerHTML = '';
        
        if (options && options.length === 4) {
            options.forEach((option, index) => {
                const optionButton = document.createElement('button');
                optionButton.className = 'option-btn';
                optionButton.textContent = option.text || `Option ${index + 1}`;
                optionButton.dataset.index = index;
                optionButton.dataset.correct = option.correct;
                optionButton.disabled = false;
                optionButton.onclick = () => this.selectAnswer(index, option.correct);
                optionsContainer.appendChild(optionButton);
            });
        } else {
            optionsContainer.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">Error: Invalid options received.</p>`;
        }
    },

    selectAnswer(optionIndex, isCorrect) {
        if (FlashcardState.answerSelected && isCorrect) return; // Prevent reselecting if already got it right
        
        FlashcardState.selectedOptionIndex = optionIndex;
        const card = FlashcardState.cards[FlashcardState.currentCardIndex];

        const optionButtons = document.querySelectorAll('.option-btn');
        
        if (isCorrect) {
            // Correct answer selected
            FlashcardState.answerSelected = true;
            
            // Disable all buttons and highlight correct
            optionButtons.forEach(btn => {
                btn.disabled = true;
                const btnCorrect = btn.dataset.correct === 'true';
                if (btnCorrect) {
                    btn.classList.add('correct-answer');
                }
            });
            
            // Show success feedback
            const feedbackDiv = document.getElementById('card-feedback');
            const feedbackMessage = document.getElementById('feedback-message');
            feedbackMessage.textContent = 'Correct! ✓';
            feedbackMessage.className = 'feedback-message correct';
            
            // Show explanation and example
            document.getElementById('card-explanation').textContent = card.explanation;
            document.getElementById('card-example').textContent = card.example;
            feedbackDiv.style.display = 'block';
            
            // Enable Next button
            document.getElementById('next-btn').disabled = false;
            
            // Record progress
            FlashcardProgress.record(true, card.topic, card.level);
        } else {
            // Wrong answer selected - mark it but allow retry
            const clickedButton = optionButtons[optionIndex];
            clickedButton.classList.add('wrong-answer');
            clickedButton.disabled = true;
            
            // Show feedback but don't block further attempts
            const feedbackDiv = document.getElementById('card-feedback');
            const feedbackMessage = document.getElementById('feedback-message');
            
            if (!feedbackDiv.style.display || feedbackDiv.style.display === 'none') {
                feedbackMessage.textContent = 'Incorrect. Try again!';
                feedbackMessage.className = 'feedback-message incorrect';
                
                // Show explanation and example even for wrong answer
                document.getElementById('card-explanation').textContent = card.explanation;
                document.getElementById('card-example').textContent = card.example;
                feedbackDiv.style.display = 'block';
            } else {
                // Update existing feedback
                feedbackMessage.textContent = 'Incorrect. Try again!';
                feedbackMessage.className = 'feedback-message incorrect';
            }
            
            // Record incorrect attempt
            FlashcardProgress.record(false, card.topic, card.level);
        }
    }
};

