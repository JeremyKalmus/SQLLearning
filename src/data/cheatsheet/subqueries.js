// Subqueries in different clauses

export const subqueriesSection = {
  id: 'subqueries',
  title: 'Subqueries',
  searchTerms: ['subquery', 'nested', 'in', 'exists', 'any', 'all', 'scalar'],
  items: [
    {
      subtitle: 'Subquery in SELECT',
      code: `SELECT
    name,
    sales,
    (SELECT AVG(sales) FROM sales) AS avg_sales
FROM sales;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Subquery in FROM',
      code: `SELECT *
FROM (
    SELECT category, SUM(sales) AS total
    FROM sales
    GROUP BY category
) AS subquery
WHERE total > 1000;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Subquery in WHERE',
      code: `-- Single value
WHERE sales > (SELECT AVG(sales) FROM sales)

-- Multiple values with IN
WHERE category IN (SELECT category FROM top_categories)

-- Existence check
WHERE EXISTS (SELECT 1 FROM other_table WHERE condition)

-- ALL comparison
WHERE sales > ALL (SELECT sales FROM competitors)

-- ANY comparison
WHERE sales > ANY (SELECT sales FROM competitors)`,
      description: null,
      tip: null
    }
  ]
};
