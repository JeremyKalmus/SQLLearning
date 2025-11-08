// Modal component for table previews and other modals
const Modal = {
    show(modalId = 'table-preview-modal') {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            lucide.createIcons();
        }
    },

    close(modalId = 'table-preview-modal') {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    },

    async showTablePreview(tableName) {
        const modal = document.getElementById('table-preview-modal');
        const modalTableName = document.getElementById('modal-table-name');
        const modalContent = document.getElementById('modal-table-content');
        const modalLoading = document.getElementById('modal-loading');
        
        if (!modal || !modalTableName || !modalContent) return;

        modalTableName.textContent = `${tableName} - Preview`;
        this.show('table-preview-modal');
        modalContent.innerHTML = '';
        if (modalLoading) modalLoading.style.display = 'block';
        
        try {
            const data = await ProblemsAPI.getSampleData(tableName, 10);
            
            if (modalLoading) modalLoading.style.display = 'none';
            
            if (data.error) {
                modalContent.innerHTML = `<p class="error-text">${data.error}</p>`;
                return;
            }
            
            if (!data.rows || data.rows.length === 0) {
                modalContent.innerHTML = '<p class="no-data-text">No data available in this table.</p>';
                return;
            }
            
            // Create table
            const headers = Object.keys(data.rows[0]);
            const tableHTML = `
                <div class="preview-table-wrapper">
                    <table class="preview-table">
                        <thead>
                            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${data.rows.map(row => 
                                `<tr>${headers.map(h => `<td>${row[h] !== null && row[h] !== undefined ? String(row[h]) : '<em>NULL</em>'}</td>`).join('')}</tr>`
                            ).join('')}
                        </tbody>
                    </table>
                    <p class="preview-note">Showing first 10 rows</p>
                </div>
            `;
            
            modalContent.innerHTML = tableHTML;
        } catch (error) {
            if (modalLoading) modalLoading.style.display = 'none';
            modalContent.innerHTML = `<p class="error-text">Error loading table data: ${error.message}</p>`;
        }
    }
};

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('table-preview-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                Modal.close();
            }
        });
    }
});


