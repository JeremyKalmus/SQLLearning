// Problem setup component - handles problem generation
const ProblemSetup = {
    async generate() {
        const difficulty = document.getElementById('difficulty-select').value;
        Loading.show('Generating your problem...', true);

        try {
            const problem = await ProblemsAPI.generate(difficulty);

            // Validate required fields
            if (!problem.title || !problem.description) {
                console.error('Invalid problem data:', problem);
                Loading.hide();
                alert('Problem generated but missing required fields. Please try again.');
                return;
            }

            Loading.completeProgress();
            ProblemState.setProblem(problem);
            ProblemWorkspace.display(problem);
            SavedProblems.load(); // Reload saved problems to show the newly generated one
        } catch (error) {
            console.error('Error generating problem:', error);
            Loading.hide();
            alert(`Error generating problem: ${error.message}. Please check the console for details.`);
        }
    }
};

// Make function available globally
window.generateProblem = () => ProblemSetup.generate();


