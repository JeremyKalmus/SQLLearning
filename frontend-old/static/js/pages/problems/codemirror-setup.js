// CodeMirror 6 SQL Editor Setup
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from 'https://cdn.jsdelivr.net/npm/@codemirror/view@6.34.3/+esm';
import { EditorState, Compartment } from 'https://cdn.jsdelivr.net/npm/@codemirror/state@6.4.1/+esm';
import { defaultKeymap, history, historyKeymap, indentWithTab } from 'https://cdn.jsdelivr.net/npm/@codemirror/commands@6.7.1/+esm';
import { syntaxHighlighting, defaultHighlightStyle, indentOnInput, bracketMatching, foldGutter } from 'https://cdn.jsdelivr.net/npm/@codemirror/language@6.10.3/+esm';
import { autocompletion, completionKeymap, closeBrackets } from 'https://cdn.jsdelivr.net/npm/@codemirror/autocomplete@6.18.3/+esm';
import { sql, MySQL, SQLite, PostgreSQL } from 'https://cdn.jsdelivr.net/npm/@codemirror/lang-sql@6.8.0/+esm';
import { oneDark } from 'https://cdn.jsdelivr.net/npm/@codemirror/theme-one-dark@6.1.2/+esm';

// SQL Keywords for autocomplete
const sqlKeywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'FULL',
    'ON', 'GROUP BY', 'HAVING', 'ORDER BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
    'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
    'ALTER', 'DROP', 'INDEX', 'VIEW', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
    'AS', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE', 'EXISTS',
    'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'UNION', 'ALL', 'INTERSECT', 'EXCEPT',
    'WITH', 'RECURSIVE', 'OVER', 'PARTITION BY', 'ROW_NUMBER', 'RANK', 'DENSE_RANK',
    'CAST', 'COALESCE', 'NULLIF', 'SUBSTRING', 'CONCAT', 'UPPER', 'LOWER', 'TRIM'
];

// Custom autocomplete function
function sqlAutocomplete(context) {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    return {
        from: word.from,
        options: sqlKeywords.map(keyword => ({
            label: keyword,
            type: 'keyword',
            boost: 1
        }))
    };
}

// Global editor instance
let editorView = null;

// Initialize CodeMirror
function initializeEditor() {
    const container = document.getElementById('sql-editor-container');
    if (!container) {
        console.error('SQL editor container not found');
        return;
    }

    const startState = EditorState.create({
        doc: '-- Write your SQL query here...\nSELECT * FROM customers;',
        extensions: [
            lineNumbers(),
            highlightActiveLineGutter(),
            highlightActiveLine(),
            history(),
            foldGutter(),
            indentOnInput(),
            bracketMatching(),
            closeBrackets(),
            autocompletion({
                override: [sqlAutocomplete],
                activateOnTyping: true,
                closeOnBlur: false
            }),
            sql({ dialect: SQLite }),
            syntaxHighlighting(defaultHighlightStyle),
            oneDark,
            keymap.of([
                ...defaultKeymap,
                ...historyKeymap,
                ...completionKeymap,
                indentWithTab
            ]),
            EditorView.lineWrapping,
            EditorView.theme({
                '&': {
                    fontSize: '14px',
                    border: '2px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    minHeight: '300px',
                    maxHeight: '500px'
                },
                '.cm-scroller': {
                    fontFamily: "'Courier New', monospace",
                    lineHeight: '1.6'
                },
                '.cm-content': {
                    padding: '10px 0',
                    caretColor: '#3b82f6'
                },
                '.cm-gutters': {
                    borderRight: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)'
                },
                '.cm-activeLineGutter': {
                    backgroundColor: 'rgba(59, 130, 246, 0.1)'
                },
                '.cm-activeLine': {
                    backgroundColor: 'rgba(59, 130, 246, 0.05)'
                },
                '.cm-selectionBackground': {
                    backgroundColor: 'rgba(59, 130, 246, 0.2) !important'
                },
                '.cm-focused .cm-selectionBackground': {
                    backgroundColor: 'rgba(59, 130, 246, 0.3) !important'
                },
                '.cm-tooltip.cm-tooltip-autocomplete': {
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--card-bg)'
                },
                '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
                    backgroundColor: 'rgba(59, 130, 246, 0.3)'
                }
            })
        ]
    });

    editorView = new EditorView({
        state: startState,
        parent: container
    });

    // Make editor view globally available
    window.sqlEditorView = editorView;
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEditor);
} else {
    initializeEditor();
}

export { editorView, initializeEditor };
