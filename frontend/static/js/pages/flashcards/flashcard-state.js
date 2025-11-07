// Shared state for flashcards page
const FlashcardState = {
    allFlashcards: {},
    currentDifficulty: 'basic',
    currentCardIndex: 0,
    cards: [],
    answerSelected: false,
    selectedOptionIndex: null,

    reset() {
        this.currentCardIndex = 0;
        this.answerSelected = false;
        this.selectedOptionIndex = null;
    }
};

