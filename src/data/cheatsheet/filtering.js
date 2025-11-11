// WHERE clause filtering

export const filteringSection = {
  id: 'filtering',
  title: 'Filtering Data (WHERE Clause)',
  searchTerms: ['where', 'filter', 'comparison', 'like', 'between', 'in', 'null', 'and', 'or', 'pattern'],
  items: [
    {
      subtitle: 'Basic Comparisons',
      code: `WHERE column = 'value'           -- Equal
WHERE column != 'value'          -- Not equal (also: <>)
WHERE column > 100               -- Greater than
WHERE column >= 100              -- Greater than or equal
WHERE column < 100               -- Less than
WHERE column <= 100              -- Less than or equal
WHERE column BETWEEN 10 AND 20   -- Between values (inclusive)
WHERE column IN ('A', 'B', 'C')  -- In a list
WHERE column NOT IN (1, 2, 3)    -- Not in a list`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Pattern Matching',
      code: `WHERE column LIKE 'Dog%'         -- Starts with "Dog"
WHERE column LIKE '%Food'        -- Ends with "Food"
WHERE column LIKE '%Cat%'        -- Contains "Cat"
WHERE column LIKE 'D_g'          -- Single character wildcard (_)
WHERE column NOT LIKE '%test%'   -- Doesn't contain "test"`,
      description: null,
      tip: null
    },
    {
      subtitle: 'NULL Handling',
      code: `WHERE column IS NULL             -- Is NULL
WHERE column IS NOT NULL         -- Is not NULL`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Multiple Conditions',
      code: `WHERE condition1 AND condition2              -- Both must be true
WHERE condition1 OR condition2               -- At least one must be true
WHERE (condition1 OR condition2) AND condition3  -- Use parentheses for logic
WHERE NOT condition1                         -- Negation`,
      description: null,
      tip: null
    }
  ]
};
