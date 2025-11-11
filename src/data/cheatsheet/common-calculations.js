// Common calculations and formulas

export const commonCalculationsSection = {
  id: 'common-calculations',
  title: 'Quick Reference: Common Calculations',
  searchTerms: ['calculation', 'formula', 'yoy', 'variance', 'percent', 'total', 'running', 'moving average', 'percentile'],
  items: [
    {
      subtitle: 'Year-over-Year Variance',
      code: `((current_year - prior_year) / prior_year) * 100`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Percent of Total',
      code: `(individual_value / SUM(value) OVER ()) * 100`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Running Total',
      code: `SUM(value) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Moving Average (7-day)',
      code: `AVG(value) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Cumulative Distribution',
      code: `CUME_DIST() OVER (ORDER BY value)  -- Returns 0 to 1`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Percentile',
      code: `PERCENT_RANK() OVER (ORDER BY value)  -- Returns 0 to 1
PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value)  -- Median`,
      description: null,
      tip: null
    }
  ]
};
