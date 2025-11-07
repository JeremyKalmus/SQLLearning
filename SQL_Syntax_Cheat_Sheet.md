# SQL Syntax Cheat Sheet

## Query Order of Execution vs. Writing Order

### How SQL is WRITTEN:
```sql
SELECT columns
FROM table
JOIN other_table ON condition
WHERE filter_conditions
GROUP BY columns
HAVING aggregate_filter
ORDER BY columns
LIMIT number;
```

### How SQL is EXECUTED (actual order):
1. **FROM** - Get the base table(s)
2. **JOIN** - Combine tables
3. **WHERE** - Filter rows (before grouping)
4. **GROUP BY** - Group rows together
5. **HAVING** - Filter groups (after grouping)
6. **SELECT** - Choose/calculate columns
7. **DISTINCT** - Remove duplicates
8. **ORDER BY** - Sort results
9. **LIMIT/OFFSET** - Limit number of rows

**Key Insight**: You can't use a SELECT alias in WHERE, but you CAN use it in ORDER BY!

---

## Basic Query Structure

### Simple SELECT
```sql
SELECT column1, column2, column3
FROM table_name;
```

### SELECT with Alias
```sql
SELECT 
    column1 AS alias1,
    column2 AS "Alias With Spaces"
FROM table_name AS t;
```

### SELECT DISTINCT (remove duplicates)
```sql
SELECT DISTINCT column1, column2
FROM table_name;
```

---

## Filtering Data (WHERE Clause)

### Basic Comparisons
```sql
WHERE column = 'value'           -- Equal
WHERE column != 'value'          -- Not equal (also: <>)
WHERE column > 100               -- Greater than
WHERE column >= 100              -- Greater than or equal
WHERE column < 100               -- Less than
WHERE column <= 100              -- Less than or equal
WHERE column BETWEEN 10 AND 20   -- Between values (inclusive)
WHERE column IN ('A', 'B', 'C')  -- In a list
WHERE column NOT IN (1, 2, 3)    -- Not in a list
```

### Pattern Matching
```sql
WHERE column LIKE 'Dog%'         -- Starts with "Dog"
WHERE column LIKE '%Food'        -- Ends with "Food"
WHERE column LIKE '%Cat%'        -- Contains "Cat"
WHERE column LIKE 'D_g'          -- Single character wildcard (_)
WHERE column NOT LIKE '%test%'   -- Doesn't contain "test"
```

### NULL Handling
```sql
WHERE column IS NULL             -- Is NULL
WHERE column IS NOT NULL         -- Is not NULL
```

### Multiple Conditions
```sql
WHERE condition1 AND condition2              -- Both must be true
WHERE condition1 OR condition2               -- At least one must be true
WHERE (condition1 OR condition2) AND condition3  -- Use parentheses for logic
WHERE NOT condition1                         -- Negation
```

---

## Joining Tables

### INNER JOIN (only matching rows)
```sql
SELECT *
FROM table1 t1
INNER JOIN table2 t2 ON t1.key = t2.key;
```

### LEFT JOIN (all from left table, matching from right)
```sql
SELECT *
FROM table1 t1
LEFT JOIN table2 t2 ON t1.key = t2.key;
```

### RIGHT JOIN (all from right table, matching from left)
```sql
SELECT *
FROM table1 t1
RIGHT JOIN table2 t2 ON t1.key = t2.key;
```

### FULL OUTER JOIN (all rows from both tables)
```sql
SELECT *
FROM table1 t1
FULL OUTER JOIN table2 t2 ON t1.key = t2.key;
```

### Multiple Joins
```sql
SELECT *
FROM sales s
JOIN date_table d ON s.date_id = d.date_id
JOIN product p ON s.product_id = p.product_id
JOIN customer c ON s.customer_id = c.customer_id;
```

### Self Join (joining table to itself)
```sql
SELECT 
    e1.employee_name,
    e2.employee_name AS manager_name
FROM employees e1
LEFT JOIN employees e2 ON e1.manager_id = e2.employee_id;
```

---

## Aggregate Functions

### Basic Aggregates
```sql
COUNT(*)                    -- Count all rows
COUNT(column)               -- Count non-NULL values
COUNT(DISTINCT column)      -- Count unique values
SUM(column)                 -- Sum of values
AVG(column)                 -- Average of values
MIN(column)                 -- Minimum value
MAX(column)                 -- Maximum value
```

### GROUP BY (group rows for aggregation)
```sql
SELECT 
    category,
    COUNT(*) AS count,
    SUM(sales) AS total_sales,
    AVG(sales) AS avg_sales
FROM sales
GROUP BY category;
```

### HAVING (filter groups)
```sql
SELECT 
    category,
    SUM(sales) AS total_sales
FROM sales
GROUP BY category
HAVING SUM(sales) > 1000;  -- Filter groups, not rows
```

**Remember**: WHERE filters rows BEFORE grouping, HAVING filters groups AFTER grouping.

---

## Window Functions (Advanced)

Window functions perform calculations across a set of rows related to the current row.

### Basic Syntax
```sql
FUNCTION() OVER (
    PARTITION BY column1    -- Optional: reset for each group
    ORDER BY column2        -- Optional: define row order
    ROWS/RANGE clause       -- Optional: define window frame
)
```

### Aggregate Window Functions
```sql
-- Running total
SUM(sales) OVER (ORDER BY date)

-- Running total by category
SUM(sales) OVER (PARTITION BY category ORDER BY date)

-- Running average
AVG(sales) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
```

### Ranking Functions
```sql
ROW_NUMBER() OVER (ORDER BY sales DESC)        -- 1, 2, 3, 4 (unique)
RANK() OVER (ORDER BY sales DESC)              -- 1, 2, 2, 4 (gaps after ties)
DENSE_RANK() OVER (ORDER BY sales DESC)        -- 1, 2, 2, 3 (no gaps)
NTILE(4) OVER (ORDER BY sales DESC)            -- Divide into 4 groups (quartiles)
```

### Value Functions
```sql
LAG(column, 1) OVER (ORDER BY date)            -- Previous row's value
LEAD(column, 1) OVER (ORDER BY date)           -- Next row's value
FIRST_VALUE(column) OVER (ORDER BY date)       -- First value in window
LAST_VALUE(column) OVER (ORDER BY date)        -- Last value in window
```

### Window Frame Clauses
```sql
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW     -- From start to current
ROWS BETWEEN 3 PRECEDING AND CURRENT ROW             -- Last 4 rows
ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING     -- Current to end
ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING             -- 3-row moving window
```

---

## Date Functions

### Current Date/Time
```sql
CURRENT_DATE                -- Today's date
CURRENT_TIME                -- Current time
CURRENT_TIMESTAMP           -- Current date and time
NOW()                       -- Current date and time (same as above)
```

### Date Arithmetic
```sql
DATE_ADD(date, INTERVAL 90 DAY)          -- Add 90 days
DATE_SUB(date, INTERVAL 1 MONTH)         -- Subtract 1 month
DATEADD(DAY, 90, date)                   -- Add 90 days (SQL Server)
DATEADD(MONTH, -1, date)                 -- Subtract 1 month (SQL Server)
```

### Date Differences
```sql
DATEDIFF(date1, date2)                   -- Difference in days
DATEDIFF(DAY, date1, date2)              -- Difference in days (SQL Server)
DATEDIFF(MONTH, date1, date2)            -- Difference in months (SQL Server)
```

### Extract Date Parts
```sql
YEAR(date)                               -- Extract year
MONTH(date)                              -- Extract month (1-12)
DAY(date)                                -- Extract day (1-31)
QUARTER(date)                            -- Extract quarter (1-4)
DAYOFWEEK(date)                          -- Day of week (1-7)
WEEK(date)                               -- Week number
EXTRACT(YEAR FROM date)                  -- Alternative syntax
DATE_PART('year', date)                  -- PostgreSQL syntax
```

### Date Formatting
```sql
DATE_FORMAT(date, '%Y-%m-%d')            -- Format as YYYY-MM-DD
TO_CHAR(date, 'YYYY-MM-DD')              -- PostgreSQL/Oracle
CONVERT(VARCHAR, date, 23)               -- SQL Server (23 = YYYY-MM-DD)
```

---

## String Functions

### Case Conversion
```sql
UPPER(column)                -- Convert to uppercase
LOWER(column)                -- Convert to lowercase
INITCAP(column)              -- Capitalize first letter of each word
```

### Substring Operations
```sql
SUBSTRING(column, start, length)         -- Extract substring
LEFT(column, 5)                          -- First 5 characters
RIGHT(column, 5)                         -- Last 5 characters
```

### String Modification
```sql
CONCAT(string1, string2)                 -- Concatenate strings
string1 || string2                       -- Concatenate (alternative)
TRIM(column)                             -- Remove leading/trailing spaces
LTRIM(column)                            -- Remove leading spaces
RTRIM(column)                            -- Remove trailing spaces
REPLACE(column, 'old', 'new')            -- Replace text
```

### String Information
```sql
LENGTH(column)                           -- Length of string
CHAR_LENGTH(column)                      -- Length (alternative)
POSITION('sub' IN column)                -- Find position of substring
```

---

## Mathematical Functions

### Basic Math
```sql
column1 + column2                        -- Addition
column1 - column2                        -- Subtraction
column1 * column2                        -- Multiplication
column1 / column2                        -- Division
column1 % column2                        -- Modulo (remainder)
MOD(column1, column2)                    -- Modulo (alternative)
```

### Rounding
```sql
ROUND(column, decimals)                  -- Round to decimals
CEIL(column)                             -- Round up
FLOOR(column)                            -- Round down
TRUNCATE(column, decimals)               -- Truncate to decimals
```

### Other Math
```sql
ABS(column)                              -- Absolute value
POWER(column, 2)                         -- Raise to power
SQRT(column)                             -- Square root
```

---

## Conditional Logic

### CASE Statements
```sql
-- Simple CASE
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
END AS sales_category
```

### COALESCE (return first non-NULL value)
```sql
COALESCE(column1, column2, 'default')    -- Returns first non-NULL
```

### NULLIF (return NULL if values are equal)
```sql
NULLIF(column1, column2)                 -- Returns NULL if equal, else column1
```

### IIF (SQL Server - inline if)
```sql
IIF(condition, true_value, false_value)
```

---

## Subqueries

### Subquery in SELECT
```sql
SELECT 
    name,
    sales,
    (SELECT AVG(sales) FROM sales) AS avg_sales
FROM sales;
```

### Subquery in FROM
```sql
SELECT *
FROM (
    SELECT category, SUM(sales) AS total
    FROM sales
    GROUP BY category
) AS subquery
WHERE total > 1000;
```

### Subquery in WHERE
```sql
-- Single value
WHERE sales > (SELECT AVG(sales) FROM sales)

-- Multiple values with IN
WHERE category IN (SELECT category FROM top_categories)

-- Existence check
WHERE EXISTS (SELECT 1 FROM other_table WHERE condition)

-- ALL comparison
WHERE sales > ALL (SELECT sales FROM competitors)

-- ANY comparison
WHERE sales > ANY (SELECT sales FROM competitors)
```

---

## Common Table Expressions (CTEs)

### Single CTE
```sql
WITH cte_name AS (
    SELECT column1, column2
    FROM table
    WHERE condition
)
SELECT *
FROM cte_name;
```

### Multiple CTEs
```sql
WITH 
first_cte AS (
    SELECT column1, column2
    FROM table1
),
second_cte AS (
    SELECT column1, COUNT(*) as count
    FROM first_cte
    GROUP BY column1
)
SELECT *
FROM second_cte;
```

### Recursive CTE (for hierarchies)
```sql
WITH RECURSIVE employee_hierarchy AS (
    -- Base case
    SELECT employee_id, name, manager_id, 1 AS level
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive case
    SELECT e.employee_id, e.name, e.manager_id, eh.level + 1
    FROM employees e
    JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)
SELECT * FROM employee_hierarchy;
```

---

## Set Operations

### UNION (combine results, remove duplicates)
```sql
SELECT column1 FROM table1
UNION
SELECT column1 FROM table2;
```

### UNION ALL (combine results, keep duplicates)
```sql
SELECT column1 FROM table1
UNION ALL
SELECT column1 FROM table2;
```

### INTERSECT (rows in both queries)
```sql
SELECT column1 FROM table1
INTERSECT
SELECT column1 FROM table2;
```

### EXCEPT (rows in first query but not second)
```sql
SELECT column1 FROM table1
EXCEPT
SELECT column1 FROM table2;
```

---

## Data Modification

### INSERT
```sql
-- Insert single row
INSERT INTO table_name (column1, column2)
VALUES ('value1', 'value2');

-- Insert multiple rows
INSERT INTO table_name (column1, column2)
VALUES 
    ('value1', 'value2'),
    ('value3', 'value4');

-- Insert from SELECT
INSERT INTO table_name (column1, column2)
SELECT column1, column2
FROM other_table
WHERE condition;
```

### UPDATE
```sql
UPDATE table_name
SET column1 = 'new_value',
    column2 = column2 * 1.1
WHERE condition;
```

### DELETE
```sql
DELETE FROM table_name
WHERE condition;
```

---

## Quick Reference: Common Calculations

### Year-over-Year Variance
```sql
((current_year - prior_year) / prior_year) * 100
```

### Percent of Total
```sql
(individual_value / SUM(value) OVER ()) * 100
```

### Running Total
```sql
SUM(value) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
```

### Moving Average (7-day)
```sql
AVG(value) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
```

### Cumulative Distribution
```sql
CUME_DIST() OVER (ORDER BY value)  -- Returns 0 to 1
```

### Percentile
```sql
PERCENT_RANK() OVER (ORDER BY value)  -- Returns 0 to 1
PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value)  -- Median
```

---

## Performance Tips

1. **Use indexes on JOIN and WHERE columns** for faster queries
2. **Filter early** - use WHERE before GROUP BY
3. **Limit columns** - SELECT only what you need
4. **Use EXPLAIN** to analyze query execution plan
5. **Avoid SELECT *** in production code
6. **Use EXISTS instead of IN** for subqueries when checking existence
7. **Use UNION ALL instead of UNION** when duplicates don't matter
8. **Avoid functions in WHERE clause** on indexed columns (breaks index)

---

## Common Patterns for Your Assessment Questions

### Pattern 1: Current Year Aggregation
```sql
SELECT SUM(sales)
FROM sales s
JOIN date_table d ON s.date_id = d.date_id
WHERE d.fiscal_year = 2025;
```

### Pattern 2: Year-over-Year Comparison
```sql
WITH current_year AS (
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
LEFT JOIN prior_year py ON cy.week = py.week;
```

### Pattern 3: Running Total by Quarter
```sql
SELECT 
    week,
    sales,
    SUM(sales) OVER (
        PARTITION BY quarter 
        ORDER BY week 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS qtw_sales
FROM sales_data;
```

### Pattern 4: First-Time Customer Count
```sql
SELECT COUNT(DISTINCT customer_id)
FROM sales s
JOIN date_table d ON s.date_id = d.date_id
JOIN product p ON s.product_id = p.product_id
WHERE d.fiscal_year = 2025
  AND d.fiscal_month = 1
  AND p.category = 'Dog Food'
  AND s.new_customer_flag = 'Y';
```

### Pattern 5: Cohort Retention Analysis
```sql
WITH first_purchase AS (
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
LEFT JOIN repeat_purchase rp ON fp.customer_id = rp.customer_id;
```

---

## Pro Tips

1. **Always use table aliases** in joins to make code readable
2. **Comment your code** with `-- comment` or `/* comment */`
3. **Format your SQL** with proper indentation
4. **Test incrementally** - build complex queries piece by piece
5. **Use CTEs for readability** instead of nested subqueries
6. **Remember data types** - use 100.0 instead of 100 for decimal division
7. **Check for NULLs** - they can break calculations and comparisons

---

Good luck with your SQL studies! 🚀
