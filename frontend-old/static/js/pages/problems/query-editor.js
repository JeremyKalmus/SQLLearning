// Query editor component
const QueryEditor = {
    getQuery() {
        // Try to get from CodeMirror first, fallback to textarea for backwards compatibility
        if (window.sqlEditorView) {
            return window.sqlEditorView.state.doc.toString().trim();
        }
        const textarea = document.getElementById('sql-query');
        return textarea ? textarea.value.trim() : '';
    },

    setQuery(query) {
        // Try to set in CodeMirror first, fallback to textarea for backwards compatibility
        if (window.sqlEditorView) {
            const transaction = window.sqlEditorView.state.update({
                changes: {
                    from: 0,
                    to: window.sqlEditorView.state.doc.length,
                    insert: query || ''
                }
            });
            window.sqlEditorView.dispatch(transaction);
        } else {
            const textarea = document.getElementById('sql-query');
            if (textarea) textarea.value = query || '';
        }
    },

    clear() {
        this.setQuery('');
        ProblemState.queryExecuted = false;
        document.getElementById('submit-btn').disabled = true;
        document.getElementById('results-panel').style.display = 'none';
    },

    async run() {
        const query = this.getQuery();

        if (!query) {
            alert('Please write a SQL query first!');
            return;
        }

        Loading.show('Executing query...');

        try {
            const result = await ProblemsAPI.execute(query);
            
            if (result) {
                ResultsDisplay.show(result);
                ProblemState.queryExecuted = true;
                document.getElementById('submit-btn').disabled = false;
            }
        } catch (error) {
            ResultsDisplay.showError(error.message || 'Query execution failed');
            ProblemState.queryExecuted = false;
            document.getElementById('submit-btn').disabled = true;
        } finally {
            Loading.hide();
        }
    },

    async getHint() {
        if (ProblemState.hintsUsed >= 3) {
            alert('You have used all available hints!');
            return;
        }

        if (!ProblemState.currentProblem) {
            alert('No problem loaded');
            return;
        }

        ProblemState.hintsUsed++;
        document.getElementById('hints-used').textContent = ProblemState.hintsUsed;

        const query = this.getQuery();
        Loading.show('Getting hint...');

        try {
            const hint = await ProblemsAPI.getHint(
                ProblemState.currentProblem.description,
                query,
                ProblemState.hintsUsed
            );

            document.getElementById('hint-text').textContent = hint;
            document.getElementById('hint-display').style.display = 'block';
        } catch (error) {
            console.error('Error getting hint:', error);
            alert('Error getting hint. Please try again.');
        } finally {
            Loading.hide();
        }
    },

    reset() {
        this.setQuery('');
        ProblemState.hintsUsed = 0;
        document.getElementById('hints-used').textContent = '0';
        document.getElementById('hint-display').style.display = 'none';
        ProblemState.queryExecuted = false;
        document.getElementById('submit-btn').disabled = true;
    }
};

// Make functions available globally
window.runQuery = () => QueryEditor.run();
window.getHint = () => QueryEditor.getHint();
window.clearQuery = () => QueryEditor.clear();


