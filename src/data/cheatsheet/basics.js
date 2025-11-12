// Basic SQL query structure

export const basicsSection = {
  id: 'basics',
  title: 'Basic Query Structure',
  searchTerms: ['select', 'from', 'basic', 'query', 'distinct', 'alias', 'as'],
  items: [
    {
      subtitle: 'Simple SELECT',
      code: `SELECT column1, column2, column3
FROM table_name;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'SELECT with Alias',
      code: `SELECT
    column1 AS alias1,
    column2 AS "Alias With Spaces"
FROM table_name AS t;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'SELECT DISTINCT (remove duplicates)',
      code: `SELECT DISTINCT column1, column2
FROM table_name;`,
      description: null,
      tip: null
    }
  ]
};
