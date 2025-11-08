// Problem setup component - handles problem generation
const ProblemSetup = {
    async generate() {
        const difficulty = document.getElementById('difficulty-select').value;
        Loading.show('Generating your problem...');

        try {
            const problem = await ProblemsAPI.generate(difficulty);
            
            // Validate required fields
            if (!problem.title || !problem.description) {
                console.error('Invalid problem data:', problem);
                alert('Problem generated but missing required fields. Please try again.');
                return;
            }

            ProblemState.setProblem(problem);
            ProblemWorkspace.display(problem);
            SavedProblems.load(); // Reload saved problems to show the newly generated one
        } catch (error) {
            console.error('Error generating problem:', error);
            alert(`Error generating problem: ${error.message}. Please check the console for details.`);
        } finally {
            Loading.hide();
        }
    }
};

// Make function available globally
window.generateProblem = () => ProblemSetup.generate();


