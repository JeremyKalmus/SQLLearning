// Set operations

export const setOperationsSection = {
  id: 'set-operations',
  title: 'Set Operations',
  searchTerms: ['union', 'intersect', 'except', 'minus', 'set', 'combine'],
  items: [
    {
      subtitle: 'UNION (combine results, remove duplicates)',
      code: `SELECT column1 FROM table1
UNION
SELECT column1 FROM table2;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'UNION ALL (combine results, keep duplicates)',
      code: `SELECT column1 FROM table1
UNION ALL
SELECT column1 FROM table2;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'INTERSECT (rows in both queries)',
      code: `SELECT column1 FROM table1
INTERSECT
SELECT column1 FROM table2;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'EXCEPT (rows in first query but not second)',
      code: `SELECT column1 FROM table1
EXCEPT
SELECT column1 FROM table2;`,
      description: null,
      tip: null
    }
  ]
};
