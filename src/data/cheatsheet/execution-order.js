// Query execution order vs writing order

export const executionOrderSection = {
  id: 'execution-order',
  title: 'Query Order of Execution vs. Writing Order',
  searchTerms: ['order', 'execution', 'writing', 'sequence', 'flow', 'from', 'where', 'select', 'group by', 'having', 'order by'],
  items: [
    {
      subtitle: 'How SQL is WRITTEN:',
      code: `SELECT columns
FROM table
JOIN other_table ON condition
WHERE filter_conditions
GROUP BY columns
HAVING aggregate_filter
ORDER BY columns
LIMIT number;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'How SQL is EXECUTED (actual order):',
      description: null,
      code: null,
      list: [
        '<strong>FROM</strong> - Get the base table(s)',
        '<strong>JOIN</strong> - Combine tables',
        '<strong>WHERE</strong> - Filter rows (before grouping)',
        '<strong>GROUP BY</strong> - Group rows together',
        '<strong>HAVING</strong> - Filter groups (after grouping)',
        '<strong>SELECT</strong> - Choose/calculate columns',
        '<strong>DISTINCT</strong> - Remove duplicates',
        '<strong>ORDER BY</strong> - Sort results',
        '<strong>LIMIT/OFFSET</strong> - Limit number of rows'
      ],
      tip: "💡 <strong>Key Insight:</strong> You can't use a SELECT alias in WHERE, but you CAN use it in ORDER BY!"
    }
  ]
};
