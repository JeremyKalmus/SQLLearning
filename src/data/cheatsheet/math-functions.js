// Mathematical functions

export const mathFunctionsSection = {
  id: 'math-functions',
  title: 'Mathematical Functions',
  searchTerms: ['math', 'arithmetic', 'round', 'ceil', 'floor', 'abs', 'power', 'sqrt', 'modulo'],
  items: [
    {
      subtitle: 'Basic Math',
      code: `column1 + column2                        -- Addition
column1 - column2                        -- Subtraction
column1 * column2                        -- Multiplication
column1 / column2                        -- Division
column1 % column2                        -- Modulo (remainder)
MOD(column1, column2)                    -- Modulo (alternative)`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Rounding',
      code: `ROUND(column, decimals)                  -- Round to decimals
CEIL(column)                             -- Round up
FLOOR(column)                            -- Round down
TRUNCATE(column, decimals)               -- Truncate to decimals`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Other Math',
      code: `ABS(column)                              -- Absolute value
POWER(column, 2)                         -- Raise to power
SQRT(column)                             -- Square root`,
      description: null,
      tip: null
    }
  ]
};
