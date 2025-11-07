// API module for progress and stats
const ProgressAPI = {
    async getStats() {
        try {
            const response = await fetch('/api/progress/stats');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    }
};

