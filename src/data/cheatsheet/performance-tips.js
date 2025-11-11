// Performance optimization tips

export const performanceTipsSection = {
  id: 'performance-tips',
  title: 'Performance Tips',
  searchTerms: ['performance', 'optimization', 'speed', 'index', 'explain', 'fast', 'slow'],
  items: [
    {
      subtitle: null,
      code: null,
      description: null,
      list: [
        'Use indexes on JOIN and WHERE columns for faster queries',
        'Filter early - use WHERE before GROUP BY',
        'Limit columns - SELECT only what you need',
        'Use EXPLAIN to analyze query execution plan',
        'Avoid SELECT * in production code',
        'Use EXISTS instead of IN for subqueries when checking existence',
        "Use UNION ALL instead of UNION when duplicates don't matter",
        'Avoid functions in WHERE clause on indexed columns (breaks index)'
      ],
      tip: null
    }
  ]
};
