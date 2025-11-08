// Stats component for loading and displaying user statistics
const Stats = {
    async load() {
        try {
            const stats = await ProgressAPI.getStats();
            this.updateDisplay(stats);
            return stats;
        } catch (error) {
            console.error('Error loading stats:', error);
            return null;
        }
    },

    updateDisplay(stats) {
        const levelEl = document.getElementById('user-level');
        const xpEl = document.getElementById('user-xp');
        const streakEl = document.getElementById('user-streak');

        if (levelEl) levelEl.textContent = stats.level || 1;
        if (xpEl) xpEl.textContent = stats.total_xp || 0;
        
        if (streakEl) {
            streakEl.innerHTML = (stats.current_streak || 0) + '<i data-lucide="flame" class="icon icon-sm"></i>';
            lucide.createIcons();
        }

        // Update additional stats if present
        const problemsSolvedEl = document.getElementById('problems-solved');
        const flashcardsReviewedEl = document.getElementById('flashcards-reviewed');
        const totalXpEl = document.getElementById('total-xp');

        if (problemsSolvedEl) problemsSolvedEl.textContent = stats.total_problems_solved || 0;
        if (flashcardsReviewedEl) flashcardsReviewedEl.textContent = stats.total_flashcards_reviewed || 0;
        if (totalXpEl) totalXpEl.textContent = stats.total_xp || 0;

        // Display recent activity if present
        if (stats.recent_problems && stats.recent_problems.length > 0) {
            const recentList = document.getElementById('recent-problems-list');
            if (recentList) {
                recentList.innerHTML = stats.recent_problems.map(problem => `
                    <div class="recent-item">
                        <span class="recent-title">${problem.title}</span>
                        <span class="recent-badge difficulty-${problem.difficulty}">${problem.difficulty}</span>
                        <span class="recent-score">Score: ${problem.score}</span>
                    </div>
                `).join('');
            }
        }
    }
};


