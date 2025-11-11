// Common patterns for assessment questions

export const assessmentPatternsSection = {
  id: 'assessment-patterns',
  title: 'Common Patterns for Assessment Questions',
  searchTerms: ['pattern', 'assessment', 'example', 'yoy', 'running total', 'cohort', 'retention', 'comparison'],
  items: [
    {
      subtitle: 'Pattern 1: Current Year Aggregation',
      code: `SELECT SUM(sales)
FROM sales s
JOIN date_table d ON s.date_id = d.date_id
WHERE d.fiscal_year = 2025;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Pattern 2: Year-over-Year Comparison',
      code: `WITH current_year AS (
    SELECT week, SUM(sales) AS cy_sales
    FROM sales s
    JOIN date_table d ON s.date_id = d.date_id
    WHERE d.fiscal_year = 2025
    GROUP BY week
),
prior_year AS (
    SELECT week, SUM(sales) AS py_sales
    FROM sales s
    JOIN date_table d ON s.date_id = d.date_id
    WHERE d.fiscal_year = 2024
    GROUP BY week
)
SELECT
    cy.week,
    cy.cy_sales,
    ((cy.cy_sales - py.py_sales) / py.py_sales) * 100 AS yoy_variance
FROM current_year cy
LEFT JOIN prior_year py ON cy.week = py.week;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Pattern 3: Running Total by Quarter',
      code: `SELECT
    week,
    sales,
    SUM(sales) OVER (
        PARTITION BY quarter
        ORDER BY week
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS qtw_sales
FROM sales_data;`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Pattern 4: First-Time Customer Count',
      code: `SELECT COUNT(DISTINCT customer_id)
FROM sales s
JOIN date_table d ON s.date_id = d.date_id
JOIN product p ON s.product_id = p.product_id
WHERE d.fiscal_year = 2025
  AND d.fiscal_month = 1
  AND p.category = 'Dog Food'
  AND s.new_customer_flag = 'Y';`,
      description: null,
      tip: null
    },
    {
      subtitle: 'Pattern 5: Cohort Retention Analysis',
      code: `WITH first_purchase AS (
    SELECT customer_id, MIN(date_id) AS first_date
    FROM sales
    WHERE conditions
    GROUP BY customer_id
),
repeat_purchase AS (
    SELECT DISTINCT fp.customer_id
    FROM first_purchase fp
    JOIN sales s ON fp.customer_id = s.customer_id
    WHERE s.date_id > fp.first_date
      AND s.date_id <= DATE_ADD(fp.first_date, INTERVAL 90 DAY)
      AND category = 'Dog Food'
)
SELECT
    (COUNT(DISTINCT rp.customer_id) * 100.0 / COUNT(DISTINCT fp.customer_id)) AS repeat_pct
FROM first_purchase fp
LEFT JOIN repeat_purchase rp ON fp.customer_id = rp.customer_id;`,
      description: null,
      tip: null
    }
  ]
};
