// Results display component
const ResultsDisplay = {
    show(results) {
        const panel = document.getElementById('results-panel');
        const content = document.getElementById('results-content');

        if (results.length === 0) {
            content.innerHTML = '<p>Query executed successfully but returned no rows.</p>';
        } else {
            // Create table
            const headers = Object.keys(results[0]);
            const tableHTML = `
                <div class="results-table-wrapper">
                    <table class="results-table">
                        <thead>
                            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${results.slice(0, 10).map(row =>
                                `<tr>${headers.map(h => `<td>${row[h] !== null && row[h] !== undefined ? String(row[h]) : '<em>NULL</em>'}</td>`).join('')}</tr>`
                            ).join('')}
                        </tbody>
                    </table>
                </div>
                ${results.length > 10 ? `<p class="result-note">Showing first 10 of ${results.length} rows</p>` : ''}
            `;
            content.innerHTML = tableHTML;
        }

        panel.style.display = 'block';
    },

    showError(message) {
        const panel = document.getElementById('results-panel');
        const content = document.getElementById('results-content');
        
        content.innerHTML = `<div class="error-message">Error: ${message}</div>`;
        panel.style.display = 'block';
    },

    hide() {
        document.getElementById('results-panel').style.display = 'none';
    }
};

