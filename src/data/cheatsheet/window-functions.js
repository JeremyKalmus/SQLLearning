// Window functions

export const windowFunctionsSection = {
  id: 'window-functions',
  title: 'Window Functions',
  searchTerms: ['window', 'over', 'partition', 'row_number', 'rank', 'dense_rank', 'lag', 'lead', 'running total', 'ntile'],
  items: [
    {
      subtitle: 'Basic Syntax',
      code: `FUNCTION() OVER (
    PARTITION BY column1    -- Optional: reset for each group
    ORDER BY column2        -- Optional: define row order
    ROWS/RANGE clause       -- Optional: define window frame
)`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Aggregate Window Functions',
      code: `-- Running total
SUM(sales) OVER (ORDER BY date)

-- Running total by category
SUM(sales) OVER (PARTITION BY category ORDER BY date)

-- Running average
AVG(sales) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Ranking Functions',
      code: `ROW_NUMBER() OVER (ORDER BY sales DESC)        -- 1, 2, 3, 4 (unique)
RANK() OVER (ORDER BY sales DESC)              -- 1, 2, 2, 4 (gaps after ties)
DENSE_RANK() OVER (ORDER BY sales DESC)        -- 1, 2, 2, 3 (no gaps)
NTILE(4) OVER (ORDER BY sales DESC)            -- Divide into 4 groups (quartiles)`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Value Functions',
      code: `LAG(column, 1) OVER (ORDER BY date)            -- Previous row's value
LEAD(column, 1) OVER (ORDER BY date)           -- Next row's value
FIRST_VALUE(column) OVER (ORDER BY date)       -- First value in window
LAST_VALUE(column) OVER (ORDER BY date)        -- Last value in window`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Window Frame Clauses',
      code: `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW     -- From start to current
ROWS BETWEEN 3 PRECEDING AND CURRENT ROW             -- Last 4 rows
ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING     -- Current to end
ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING             -- 3-row moving window`,
      description: null,
      tip: null
    }
  ]
};
