// Conditional logic and expressions

export const conditionalLogicSection = {
  id: 'conditional-logic',
  title: 'Conditional Logic',
  searchTerms: ['case', 'when', 'then', 'else', 'coalesce', 'nullif', 'iif', 'conditional'],
  items: [
    {
      subtitle: 'CASE Statements',
      code: `-- Simple CASE
CASE column
    WHEN 'A' THEN 'Apple'
    WHEN 'B' THEN 'Banana'
    ELSE 'Other'
END AS fruit_name

-- Searched CASE (more flexible)
CASE
    WHEN sales > 1000 THEN 'High'
    WHEN sales > 500 THEN 'Medium'
    WHEN sales > 0 THEN 'Low'
    ELSE 'No Sales'
END AS sales_category`,
      description: null,
      tip: null
    },
    {
      subtitle: 'COALESCE (return first non-NULL value)',
      code: `COALESCE(column1, column2, 'default')    -- Returns first non-NULL`,
      description: null,
      tip: null
    },
    {
      subtitle: 'NULLIF (return NULL if values are equal)',
      code: `NULLIF(column1, column2)                 -- Returns NULL if equal, else column1`,
      description: null,
      tip: null
    },
    {
      subtitle: 'IIF (SQL Server - inline if)',
      code: `IIF(condition, true_value, false_value)`,
      description: null,
      tip: null
    }
  ]
};
