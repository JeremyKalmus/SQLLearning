// Problem workspace component - manages workspace display and navigation
const ProblemWorkspace = {
    display(problem) {
        // Display problem details
        document.getElementById('problem-title').textContent = problem.title || 'Untitled Problem';
        document.getElementById('problem-description').textContent = problem.description || 'No description available';
        document.getElementById('problem-topic').textContent = problem.topic || 'General SQL';
        
        const difficultyEl = document.getElementById('problem-difficulty');
        difficultyEl.textContent = problem.difficulty || 'basic';
        difficultyEl.className = `difficulty-badge difficulty-${problem.difficulty || 'basic'}`;

        // Reset UI components
        QueryEditor.reset();
        ResultsDisplay.hide();
        FeedbackDisplay.reset();

        // Show workspace
        document.getElementById('setup-panel').style.display = 'none';
        document.getElementById('workspace').style.display = 'block';
        document.getElementById('back-to-problems-btn').style.display = 'inline-block';
        document.getElementById('back-to-home-btn').style.display = 'none';
    },

    showSetup() {
        document.getElementById('setup-panel').style.display = 'block';
        document.getElementById('workspace').style.display = 'none';
        document.getElementById('back-to-problems-btn').style.display = 'none';
        document.getElementById('back-to-home-btn').style.display = 'inline-block';
        SavedProblems.load(); // Reload saved problems when returning to setup
    }
};

// Make functions available globally
window.backToProblems = () => ProblemWorkspace.showSetup();
window.nextProblem = () => ProblemWorkspace.showSetup();

// Submit query function
window.submitQuery = async function() {
    const query = QueryEditor.getQuery();

    if (!query) {
        alert('Please write a SQL query first!');
        return;
    }

    if (!ProblemState.queryExecuted) {
        alert('Please run your query first to see the results before submitting for review.');
        return;
    }

    if (!ProblemState.currentProblem) {
        alert('No problem loaded');
        return;
    }

    Loading.show('Checking your answer...');

    try {
        const feedback = await ProblemsAPI.check(
            query,
            ProblemState.currentProblem.description,
            ProblemState.currentProblem.title,
            ProblemState.currentProblem.difficulty,
            ProblemState.currentProblem.topic
        );

        FeedbackDisplay.show(feedback);
        SavedProblems.load(); // Reload saved problems to show updated score
    } catch (error) {
        console.error('Error submitting query:', error);
        alert(`Error submitting query: ${error.message || 'Please try again.'}`);
    } finally {
        Loading.hide();
    }
};

