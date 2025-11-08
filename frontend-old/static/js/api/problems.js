// API module for problems
const ProblemsAPI = {
    async generate(difficulty, topic = null) {
        try {
            const response = await fetch('/api/problem/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ difficulty, topic })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({error: 'Unknown error'}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error generating problem:', error);
            throw error;
        }
    },

    async getSaved(limit = 50) {
        try {
            const response = await fetch(`/api/problem/saved?limit=${limit}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.problems || [];
        } catch (error) {
            console.error('Error fetching saved problems:', error);
            throw error;
        }
    },

    async getSavedById(problemId) {
        try {
            const response = await fetch(`/api/problem/saved/${problemId}`);
            if (!response.ok) {
                throw new Error('Problem not found');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching saved problem:', error);
            throw error;
        }
    },

    async deleteSaved(problemId) {
        try {
            const response = await fetch(`/api/problem/saved/${problemId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('Failed to delete problem');
            }
            return await response.json();
        } catch (error) {
            console.error('Error deleting saved problem:', error);
            throw error;
        }
    },

    async execute(query) {
        try {
            const response = await fetch('/api/problem/execute', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ query })
            });
            const data = await response.json();
            if (!response.ok || data.error) {
                throw new Error(data.error || 'Query execution failed');
            }
            return data.result;
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        }
    },

    async check(query, problemDescription, problemId, difficulty, topic, result = null) {
        try {
            const response = await fetch('/api/problem/check', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    query,
                    problem_description: problemDescription,
                    problem_id: problemId,
                    difficulty,
                    topic,
                    result
                })
            });
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            return data.feedback;
        } catch (error) {
            console.error('Error checking answer:', error);
            throw error;
        }
    },

    async getHint(problemDescription, query = '', hintLevel = 1) {
        try {
            const response = await fetch('/api/problem/hint', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    problem_description: problemDescription,
                    query,
                    hint_level: hintLevel
                })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.hint;
        } catch (error) {
            console.error('Error getting hint:', error);
            throw error;
        }
    },

    async getSchema() {
        try {
            const response = await fetch('/api/database/schema');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching schema:', error);
            throw error;
        }
    },

    async getSampleData(table, limit = 10) {
        try {
            const response = await fetch(`/api/database/sample-data?table=${table}&limit=${limit}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching sample data:', error);
            throw error;
        }
    }
};


