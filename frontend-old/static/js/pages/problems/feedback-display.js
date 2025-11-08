// Feedback and solution display component
const FeedbackDisplay = {
    show(feedback) {
        document.getElementById('feedback-score').textContent = feedback.score || 0;
        document.getElementById('feedback-message').textContent = feedback.message || '';
        document.getElementById('feedback-praise').textContent = feedback.praise || '';

        if (feedback.improvements && feedback.improvements.length > 0) {
            const improvementsHTML = `
                <h5>Suggestions:</h5>
                <ul>${feedback.improvements.map(i => `<li>${i}</li>`).join('')}</ul>
            `;
            document.getElementById('feedback-improvements').innerHTML = improvementsHTML;
        } else {
            document.getElementById('feedback-improvements').innerHTML = '';
        }

        document.getElementById('feedback-panel').style.display = 'block';
        document.getElementById('feedback-panel').className =
            feedback.correct ? 'feedback-panel correct' : 'feedback-panel incorrect';

        Stats.load();
    },

    hide() {
        document.getElementById('feedback-panel').style.display = 'none';
    },

    showSolution() {
        if (!ProblemState.currentProblem) return;

        document.getElementById('solution-query').textContent = ProblemState.currentProblem.solution || '';
        document.getElementById('solution-explanation').textContent = ProblemState.currentProblem.explanation || '';
        document.getElementById('solution-panel').style.display = 'block';
    },

    hideSolution() {
        document.getElementById('solution-panel').style.display = 'none';
    },

    reset() {
        this.hide();
        this.hideSolution();
    }
};

// Make functions available globally
window.showSolution = () => FeedbackDisplay.showSolution();


