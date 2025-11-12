// String manipulation functions

export const stringFunctionsSection = {
  id: 'string-functions',
  title: 'String Functions',
  searchTerms: ['string', 'text', 'upper', 'lower', 'concat', 'substring', 'trim', 'replace', 'length'],
  items: [
    {
      subtitle: 'Case Conversion',
      code: `UPPER(column)                -- Convert to uppercase
LOWER(column)                -- Convert to lowercase
INITCAP(column)              -- Capitalize first letter of each word`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Substring Operations',
      code: `SUBSTRING(column, start, length)         -- Extract substring
LEFT(column, 5)                          -- First 5 characters
RIGHT(column, 5)                         -- Last 5 characters`,
      description: null,
      tip: null
    },
    {
      subtitle: 'String Modification',
      code: `CONCAT(string1, string2)                 -- Concatenate strings
string1 || string2                       -- Concatenate (alternative)
TRIM(column)                             -- Remove leading/trailing spaces
LTRIM(column)                            -- Remove leading spaces
RTRIM(column)                            -- Remove trailing spaces
REPLACE(column, 'old', 'new')            -- Replace text`,
      description: null,
      tip: null
    },
    {
      subtitle: 'String Information',
      code: `LENGTH(column)                           -- Length of string
CHAR_LENGTH(column)                      -- Length (alternative)
POSITION('sub' IN column)                -- Find position of substring`,
      description: null,
      tip: null
    }
  ]
};
