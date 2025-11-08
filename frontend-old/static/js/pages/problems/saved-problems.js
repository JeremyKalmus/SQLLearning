// Saved problems management component
const SavedProblems = {
    async load() {
        try {
            const problems = await ProblemsAPI.getSaved();
            this.render(problems);
        } catch (error) {
            console.error('Error loading saved problems:', error);
            const listElement = document.getElementById('saved-problems-list');
            if (listElement) {
                listElement.innerHTML = '<p class="error-text">Error loading saved problems</p>';
            }
        }
    },

    render(problems) {
        const listElement = document.getElementById('saved-problems-list');
        
        if (!listElement) return;

        if (problems.length === 0) {
            listElement.innerHTML = '<p class="no-problems-text">No saved problems yet. Generate a problem to get started!</p>';
            return;
        }
        
        listElement.innerHTML = problems.map(problem => {
            const p = problem.problem;
            const createdDate = new Date(problem.created_at).toLocaleDateString();
            const bestScore = problem.best_score !== undefined ? problem.best_score : null;
            const attempts = problem.attempts || 0;
            const solved = problem.solved || false;
            
            let scoreHTML = '';
            if (bestScore !== null) {
                const scoreClass = solved ? 'score-solved' : 'score-attempted';
                scoreHTML = `
                    <div class="saved-problem-score">
                        <span class="score-badge ${scoreClass}">
                            <i data-lucide="${solved ? 'check-circle' : 'target'}" class="icon icon-xs"></i>
                            Best: ${bestScore}/100
                        </span>
                        ${attempts > 1 ? `<span class="attempts-badge">${attempts} attempts</span>` : ''}
                    </div>
                `;
            }
            
            return `
                <div class="saved-problem-card" onclick="SavedProblems.loadById(${problem.id})">
                    <div class="saved-problem-header">
                        <h5>${p.title || 'Untitled Problem'}</h5>
                        <button class="btn-icon-small" onclick="event.stopPropagation(); SavedProblems.delete(${problem.id})" title="Delete">
                            <i data-lucide="trash-2" class="icon icon-sm"></i>
                        </button>
                    </div>
                    <div class="saved-problem-meta">
                        <div class="saved-problem-meta-left">
                            <span class="difficulty-badge difficulty-${p.difficulty || 'basic'}">${p.difficulty || 'basic'}</span>
                            <span class="saved-problem-topic">${p.topic || 'General SQL'}</span>
                        </div>
                        <div class="saved-problem-meta-right">
                            ${scoreHTML}
                            <span class="saved-problem-date">${createdDate}</span>
                        </div>
                    </div>
                    <p class="saved-problem-description">${(p.description || '').substring(0, 100)}${(p.description || '').length > 100 ? '...' : ''}</p>
                </div>
            `;
        }).join('');
        
        lucide.createIcons();
    },

    async loadById(problemId) {
        Loading.show('Loading problem...');
        
        try {
            const problem = await ProblemsAPI.getSavedById(problemId);
            ProblemState.setProblem(problem);
            ProblemWorkspace.display(problem);
        } catch (error) {
            console.error('Error loading saved problem:', error);
            alert('Error loading problem. Please try again.');
            this.load(); // Reload the list
        } finally {
            Loading.hide();
        }
    },

    async delete(problemId) {
        if (!confirm('Are you sure you want to delete this saved problem?')) {
            return;
        }
        
        try {
            await ProblemsAPI.deleteSaved(problemId);
            this.load(); // Reload the list
        } catch (error) {
            console.error('Error deleting saved problem:', error);
            alert('Error deleting problem');
        }
    }
};

// Make functions available globally
window.loadSavedProblem = (id) => SavedProblems.loadById(id);
window.deleteSavedProblem = (id) => SavedProblems.delete(id);
window.loadSavedProblems = () => SavedProblems.load();


