/**
 * Flashcard State Reducer
 * Manages all flashcard-related state in a centralized reducer
 */

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Initial state for flashcard reducer
 */
export const initialState = {
  // Card data
  cards: [],
  shuffledIndices: [],
  currentIndex: 0,

  // Card interaction state
  isFlipped: false,

  // Multiple choice options state
  showOptions: false,
  selectedOption: null,
  options: [],

  // Session statistics
  sessionStats: {
    reviewed: 0,
    correct: 0
  },

  // Loading states
  loading: {
    cards: true,
    options: false,
    more: false,
    generating: false
  }
};

/**
 * Flashcard reducer function
 * @param {Object} state - Current state
 * @param {Object} action - Action to perform
 * @returns {Object} New state
 */
export function flashcardReducer(state, action) {
  switch (action.type) {
    case 'SET_CARDS':
      // Set new cards and shuffle indices
      return {
        ...state,
        cards: action.payload,
        shuffledIndices: action.payload.length > 0
          ? shuffleArray([...Array(action.payload.length).keys()])
          : [],
        currentIndex: 0,
        isFlipped: false,
        showOptions: false,
        selectedOption: null,
        options: []
      };

    case 'ADD_CARDS':
      // Add more cards and re-shuffle all indices
      const newCards = [...state.cards, ...action.payload];
      return {
        ...state,
        cards: newCards,
        shuffledIndices: newCards.length > 0
          ? shuffleArray([...Array(newCards.length).keys()])
          : [],
        currentIndex: 0
      };

    case 'FLIP_CARD':
      // Toggle card flip state
      return {
        ...state,
        isFlipped: !state.isFlipped
      };

    case 'NEXT_CARD':
      // Move to next card and reset card state
      const nextIndex = Math.min(state.currentIndex + 1, state.shuffledIndices.length - 1);
      return {
        ...state,
        currentIndex: nextIndex,
        isFlipped: false,
        showOptions: false,
        selectedOption: null,
        options: []
      };

    case 'PREVIOUS_CARD':
      // Move to previous card and reset card state
      const prevIndex = Math.max(state.currentIndex - 1, 0);
      return {
        ...state,
        currentIndex: prevIndex,
        isFlipped: false,
        showOptions: false,
        selectedOption: null,
        options: []
      };

    case 'SET_OPTIONS':
      // Set multiple choice options for current card
      return {
        ...state,
        options: action.payload,
        showOptions: true
      };

    case 'SELECT_OPTION':
      // Select a multiple choice option
      return {
        ...state,
        selectedOption: action.payload
      };

    case 'RESET_SELECTION':
      // Reset option selection (for "Try Again" functionality)
      return {
        ...state,
        selectedOption: null
      };

    case 'INCREMENT_STATS':
      // Update session statistics
      return {
        ...state,
        sessionStats: {
          reviewed: state.sessionStats.reviewed + 1,
          correct: action.correct
            ? state.sessionStats.correct + 1
            : state.sessionStats.correct
        }
      };

    case 'RESET_STATS':
      // Reset session statistics
      return {
        ...state,
        sessionStats: {
          reviewed: 0,
          correct: 0
        }
      };

    case 'SET_LOADING':
      // Update a specific loading state
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.loadingType]: action.payload
        }
      };

    case 'RESET_CARD_STATE':
      // Reset all card interaction state
      return {
        ...state,
        isFlipped: false,
        showOptions: false,
        selectedOption: null,
        options: []
      };

    case 'RESET_ALL':
      // Reset to initial state (useful for level changes)
      return {
        ...initialState,
        loading: {
          ...initialState.loading,
          cards: true
        }
      };

    default:
      return state;
  }
}
