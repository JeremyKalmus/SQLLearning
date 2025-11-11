// JOIN operations

export const joinsSection = {
  id: 'joins',
  title: 'Joining Tables',
  searchTerms: ['join', 'inner', 'left', 'right', 'outer', 'self', 'multiple', 'on'],
  items: [
    {
      subtitle: 'INNER JOIN (only matching rows)',
      code: `SELECT *
FROM table1 t1
INNER JOIN table2 t2 ON t1.key = t2.key;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'LEFT JOIN (all from left table, matching from right)',
      code: `SELECT *
FROM table1 t1
LEFT JOIN table2 t2 ON t1.key = t2.key;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'RIGHT JOIN (all from right table, matching from left)',
      code: `SELECT *
FROM table1 t1
RIGHT JOIN table2 t2 ON t1.key = t2.key;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'FULL OUTER JOIN (all rows from both tables)',
      code: `SELECT *
FROM table1 t1
FULL OUTER JOIN table2 t2 ON t1.key = t2.key;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Multiple Joins',
      code: `SELECT *
FROM sales s
JOIN date_table d ON s.date_id = d.date_id
JOIN product p ON s.product_id = p.product_id
JOIN customer c ON s.customer_id = c.customer_id;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Self Join (joining table to itself)',
      code: `SELECT
    e1.employee_name,
    e2.employee_name AS manager_name
FROM employees e1
LEFT JOIN employees e2 ON e1.manager_id = e2.employee_id;`,
      description: null,
      tip: null
    }
  ]
};
