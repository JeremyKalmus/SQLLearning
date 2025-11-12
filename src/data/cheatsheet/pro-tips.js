// Pro tips for writing SQL

export const proTipsSection = {
  id: 'pro-tips',
  title: 'Pro Tips',
  searchTerms: ['tips', 'best practices', 'advice', 'recommendation', 'style'],
  items: [
    {
      subtitle: null,
      code: null,
      description: null,
      list: [
        '<strong>Always use table aliases</strong> in joins to make code readable',
        '<strong>Comment your code</strong> with -- comment or /* comment */',
        '<strong>Format your SQL</strong> with proper indentation',
        '<strong>Test incrementally</strong> - build complex queries piece by piece',
        '<strong>Use CTEs for readability</strong> instead of nested subqueries',
        '<strong>Remember data types</strong> - use 100.0 instead of 100 for decimal division',
        '<strong>Check for NULLs</strong> - they can break calculations and comparisons'
      ],
      tip: null
    }
  ]
};
