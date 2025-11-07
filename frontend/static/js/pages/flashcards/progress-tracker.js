// Flashcard progress tracker - handles progress display and tracking
const FlashcardProgress = {
    async record(correct, topic, level) {
        const card = FlashcardState.cards[FlashcardState.currentCardIndex];

        try {
            await FlashcardsAPI.updateProgress(card.id, correct, topic, level);
            Stats.load();
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    },

    display(stats) {
        if (stats.flashcard_stats_by_topic_level) {
            this.displayTopicLevelStats(stats.flashcard_stats_by_topic_level);
        }
    },

    displayTopicLevelStats(stats) {
        const progressDiv = document.getElementById('difficulty-progress');
        if (!progressDiv) return;

        progressDiv.innerHTML = '<h3>Your Progress by Topic</h3>';
        
        for (const [level, topics] of Object.entries(stats)) {
            const levelDiv = document.createElement('div');
            levelDiv.className = 'level-stats';
            levelDiv.innerHTML = `<h4>${level.charAt(0).toUpperCase() + level.slice(1)}</h4>`;
            
            const topicsList = document.createElement('ul');
            for (const [topic, topicStats] of Object.entries(topics)) {
                const topicItem = document.createElement('li');
                topicItem.innerHTML = `
                    <strong>${topic}</strong>: 
                    ${topicStats.accuracy.toFixed(1)}% accuracy 
                    (${topicStats.total_correct}/${topicStats.total_reviews} correct)
                `;
                topicsList.appendChild(topicItem);
            }
            levelDiv.appendChild(topicsList);
            progressDiv.appendChild(levelDiv);
        }
    }
};

// Override Stats.load to also display flashcard progress
const originalStatsLoad = Stats.load;
Stats.load = async function() {
    const stats = await originalStatsLoad.call(this);
    if (stats && typeof FlashcardProgress !== 'undefined') {
        FlashcardProgress.display(stats);
    }
    return stats;
};

