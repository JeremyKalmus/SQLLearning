// Shared state for problems page
const ProblemState = {
    currentProblem: null,
    hintsUsed: 0,
    queryExecuted: false,

    reset() {
        this.currentProblem = null;
        this.hintsUsed = 0;
        this.queryExecuted = false;
    },

    setProblem(problem) {
        this.currentProblem = problem;
        this.hintsUsed = 0;
        this.queryExecuted = false;
    }
};


