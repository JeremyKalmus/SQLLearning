// API module for flashcards
const FlashcardsAPI = {
    async getAll() {
        try {
            const response = await fetch('/api/flashcards/all');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching flashcards:', error);
            throw error;
        }
    },

    async getOptions(card) {
        try {
            const response = await fetch('/api/flashcards/options', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({card})
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({error: 'Unknown error'}));
                throw new Error(`HTTP error! status: ${response.status}, ${errorData.error || ''}`);
            }
            const data = await response.json();
            return data.options;
        } catch (error) {
            console.error('Error fetching flashcard options:', error);
            throw error;
        }
    },

    async updateProgress(cardId, correct, topic, level) {
        try {
            const response = await fetch('/api/flashcards/progress', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    card_id: cardId,
                    correct: correct,
                    topic: topic,
                    level: level
                })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating flashcard progress:', error);
            throw error;
        }
    }
};

