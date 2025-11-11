// Common Table Expressions

export const ctesSection = {
  id: 'ctes',
  title: 'Common Table Expressions (CTEs)',
  searchTerms: ['cte', 'with', 'common table expression', 'recursive', 'hierarchy'],
  items: [
    {
      subtitle: 'Single CTE',
      code: `WITH cte_name AS (
    SELECT column1, column2
    FROM table
    WHERE condition
)
SELECT *
FROM cte_name;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Multiple CTEs',
      code: `WITH
first_cte AS (
    SELECT column1, column2
    FROM table1
),
second_cte AS (
    SELECT column1, COUNT(*) as count
    FROM first_cte
    GROUP BY column1
)
SELECT *
FROM second_cte;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Recursive CTE (for hierarchies)',
      code: `WITH RECURSIVE employee_hierarchy AS (
    -- Base case
    SELECT employee_id, name, manager_id, 1 AS level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive case
    SELECT e.employee_id, e.name, e.manager_id, eh.level + 1
    FROM employees e
    JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)
SELECT * FROM employee_hierarchy;`,
      description: null,
      tip: null
    }
  ]
};
