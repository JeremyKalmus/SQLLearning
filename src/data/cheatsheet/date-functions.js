// Date and time functions

export const dateFunctionsSection = {
  id: 'date-functions',
  title: 'Date Functions',
  searchTerms: ['date', 'time', 'current_date', 'now', 'dateadd', 'datediff', 'year', 'month', 'day', 'extract', 'format'],
  items: [
    {
      subtitle: 'Current Date/Time',
      code: `CURRENT_DATE                -- Today's date
CURRENT_TIME                -- Current time
CURRENT_TIMESTAMP           -- Current date and time
NOW()                       -- Current date and time (same as above)`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Date Arithmetic',
      code: `DATE_ADD(date, INTERVAL 90 DAY)          -- Add 90 days
DATE_SUB(date, INTERVAL 1 MONTH)         -- Subtract 1 month
DATEADD(DAY, 90, date)                   -- Add 90 days (SQL Server)
DATEADD(MONTH, -1, date)                 -- Subtract 1 month (SQL Server)`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Date Differences',
      code: `DATEDIFF(date1, date2)                   -- Difference in days
DATEDIFF(DAY, date1, date2)              -- Difference in days (SQL Server)
DATEDIFF(MONTH, date1, date2)            -- Difference in months (SQL Server)`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Extract Date Parts',
      code: `YEAR(date)                               -- Extract year
MONTH(date)                              -- Extract month (1-12)
DAY(date)                                -- Extract day (1-31)
QUARTER(date)                            -- Extract quarter (1-4)
DAYOFWEEK(date)                          -- Day of week (1-7)
WEEK(date)                               -- Week number
EXTRACT(YEAR FROM date)                  -- Alternative syntax
DATE_PART('year', date)                  -- PostgreSQL syntax`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Date Formatting',
      code: `DATE_FORMAT(date, '%Y-%m-%d')            -- Format as YYYY-MM-DD
TO_CHAR(date, 'YYYY-MM-DD')              -- PostgreSQL/Oracle
CONVERT(VARCHAR, date, 23)               -- SQL Server (23 = YYYY-MM-DD)`,
      description: null,
      tip: null
    }
  ]
};
