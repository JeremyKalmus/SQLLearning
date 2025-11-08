// Schema viewer component
const SchemaViewer = {
    async load() {
        try {
            const schema = await ProblemsAPI.getSchema();
            this.render(schema);
            // Show schema by default
            document.getElementById('schema-content').style.display = 'block';
        } catch (error) {
            console.error('Error loading schema:', error);
        }
    },

    render(schema) {
        const schemaHTML = Object.entries(schema).map(([table, info]) => {
            // Create a set of foreign key column names for quick lookup
            const fkColumns = new Set((info.foreign_keys || []).map(fk => fk.column));
            
            const columns = info.columns.map(col => {
                const badges = [];
                if (col.primary_key) badges.push('<span class="pk-badge">PK</span>');
                if (fkColumns.has(col.name)) badges.push('<span class="fk-badge">FK</span>');
                const badgeHTML = badges.length > 0 ? ' ' + badges.join(' ') : '';
                return `<li><strong>${col.name}</strong>: ${col.type}${badgeHTML}</li>`;
            }).join('');

            return `
                <div class="schema-table">
                    <div class="schema-table-header">
                        <h5>${table}</h5>
                        <button class="btn-icon-small btn-preview" onclick="Modal.showTablePreview('${table}')" title="Preview table data">
                            <i data-lucide="eye" class="icon icon-sm"></i>
                        </button>
                    </div>
                    <ul>${columns}</ul>
                </div>
            `;
        }).join('');

        document.getElementById('schema-tables').innerHTML = schemaHTML;
        lucide.createIcons();
    },

    toggle() {
        const content = document.getElementById('schema-content');
        const btn = document.getElementById('schema-toggle-btn');
        const icon = btn.querySelector('i');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.setAttribute('data-lucide', 'chevron-up');
        } else {
            content.style.display = 'none';
            icon.setAttribute('data-lucide', 'chevron-down');
        }
        lucide.createIcons();
    }
};

// Make toggleSchema available globally
window.toggleSchema = () => SchemaViewer.toggle();


