// Aggregate functions and GROUP BY

export const aggregatesSection = {
  id: 'aggregates',
  title: 'Aggregate Functions',
  searchTerms: ['aggregate', 'count', 'sum', 'avg', 'min', 'max', 'group by', 'having', 'distinct'],
  items: [
    {
      subtitle: 'Basic Aggregates',
      code: `COUNT(*)                    -- Count all rows
COUNT(column)               -- Count non-NULL values
COUNT(DISTINCT column)      -- Count unique values
SUM(column)                 -- Sum of values
AVG(column)                 -- Average of values
MIN(column)                 -- Minimum value
MAX(column)                 -- Maximum value`,
      description: null,
      tip: null
    },
    {
      subtitle: 'GROUP BY (group rows for aggregation)',
      code: `SELECT
    category,
    COUNT(*) AS count,
    SUM(sales) AS total_sales,
    AVG(sales) AS avg_sales
FROM sales
GROUP BY category;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'HAVING (filter groups)',
      code: `SELECT
    category,
    SUM(sales) AS total_sales
FROM sales
GROUP BY category
HAVING SUM(sales) > 1000;  -- Filter groups, not rows`,
      description: null,
      tip: "💡 <strong>Remember:</strong> WHERE filters rows BEFORE grouping, HAVING filters groups AFTER grouping."
    }
  ]
};
