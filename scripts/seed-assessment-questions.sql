-- ============================================================================
-- Seed Assessment Questions
-- Comprehensive SQL skill assessment covering Basic to Advanced levels
-- ============================================================================

-- Insert 15 comprehensive assessment questions
INSERT INTO assessment_questions (assessment_id, question_order, question_type, skill_category, specific_skills, difficulty_weight, question_data) VALUES

-- ============================================================================
-- BASIC LEVEL QUESTIONS (1-3)
-- ============================================================================

-- Question 1: Multiple Choice - WHERE clause
(1, 1, 'multiple_choice', 'basic', ARRAY['WHERE Clause'], 1.0,
'{
  "type": "multiple_choice",
  "question": "Which SQL clause filters rows before any grouping occurs?",
  "options": ["HAVING", "WHERE", "GROUP BY", "ORDER BY"],
  "correctAnswer": 1,
  "explanation": "WHERE filters rows before grouping. HAVING filters after grouping. This is a fundamental difference in SQL query execution order."
}'::jsonb),

-- Question 2: Fill Blank - SELECT basics
(1, 2, 'fill_blank', 'basic', ARRAY['SELECT Fundamentals', 'DISTINCT'], 1.0,
'{
  "type": "fill_blank",
  "question": "Complete the query to select unique city names from a customers table",
  "queryTemplate": "SELECT _____ city FROM customers;",
  "blanks": [
    {
      "position": 0,
      "correctAnswer": "DISTINCT",
      "acceptableAnswers": ["distinct"]
    }
  ],
  "explanation": "DISTINCT removes duplicate values from the result set."
}'::jsonb),

-- Question 3: Multiple Choice - NULL handling
(1, 3, 'multiple_choice', 'basic', ARRAY['NULL Handling', 'WHERE Clause'], 1.0,
'{
  "type": "multiple_choice",
  "question": "Which operator should you use to check if a value is NULL?",
  "options": ["= NULL", "== NULL", "IS NULL", "EQUALS NULL"],
  "correctAnswer": 2,
  "explanation": "IS NULL is the correct operator to check for NULL values. Using = NULL will not work because NULL cannot be compared with equality operators."
}'::jsonb),

-- ============================================================================
-- INTERMEDIATE LEVEL QUESTIONS (4-8)
-- ============================================================================

-- Question 4: Write Query - Basic JOIN
(1, 4, 'write_query', 'intermediate', ARRAY['JOINs'], 1.5,
'{
  "type": "write_query",
  "question": "Write a query to show customer names and their order IDs",
  "description": "Join the customers and orders tables to display customer_name and order_id for all orders. The tables are related by customer_id.",
  "solutionQuery": "SELECT c.customer_name, o.order_id\\nFROM customers c\\nINNER JOIN orders o ON c.customer_id = o.customer_id;"
}'::jsonb),

-- Question 5: Multiple Choice - Aggregate functions
(1, 5, 'multiple_choice', 'intermediate', ARRAY['Aggregates'], 1.0,
'{
  "type": "multiple_choice",
  "question": "Which aggregate function counts all rows, including those with NULL values?",
  "options": ["COUNT(column_name)", "COUNT(*)", "SUM(column_name)", "COUNT(DISTINCT column_name)"],
  "correctAnswer": 1,
  "explanation": "COUNT(*) counts all rows regardless of NULL values. COUNT(column_name) only counts non-NULL values in that column."
}'::jsonb),

-- Question 6: Write Query - GROUP BY with aggregate
(1, 6, 'write_query', 'intermediate', ARRAY['GROUP BY', 'Aggregates'], 1.5,
'{
  "type": "write_query",
  "question": "Find the total order amount for each customer",
  "description": "Write a query that shows customer_id and their total order amount (sum of order_amount). Group by customer.",
  "solutionQuery": "SELECT customer_id, SUM(order_amount) as total_amount\\nFROM orders\\nGROUP BY customer_id;"
}'::jsonb),

-- Question 7: Read Query - Understanding JOINs
(1, 7, 'read_query', 'intermediate', ARRAY['JOINs'], 1.0,
'{
  "type": "read_query",
  "question": "What does this query return?",
  "queryToRead": "SELECT c.name\\nFROM customers c\\nLEFT JOIN orders o ON c.customer_id = o.customer_id\\nWHERE o.order_id IS NULL;",
  "options": [
    "All customers",
    "Customers who have placed orders",
    "Customers who have NOT placed any orders",
    "All orders without customers"
  ],
  "correctAnswer": 2,
  "explanation": "LEFT JOIN returns all customers, and WHERE o.order_id IS NULL filters for customers with no matching orders, effectively finding customers who have NOT placed orders."
}'::jsonb),

-- Question 8: Fill Blank - HAVING clause
(1, 8, 'fill_blank', 'intermediate', ARRAY['HAVING', 'GROUP BY'], 1.0,
'{
  "type": "fill_blank",
  "question": "Complete this query to find customers with more than 5 orders",
  "queryTemplate": "SELECT customer_id, COUNT(*) as order_count\\nFROM orders\\nGROUP BY customer_id\\n_____ COUNT(*) > 5;",
  "blanks": [
    {
      "position": 0,
      "correctAnswer": "HAVING",
      "acceptableAnswers": ["having"]
    }
  ],
  "explanation": "HAVING is used to filter grouped results. WHERE cannot be used with aggregate functions."
}'::jsonb),

-- ============================================================================
-- ADVANCED LEVEL QUESTIONS (9-14)
-- ============================================================================

-- Question 9: Write Query - Window Functions
(1, 9, 'write_query', 'advanced', ARRAY['Window Functions'], 2.0,
'{
  "type": "write_query",
  "question": "Rank employees by salary within each department",
  "description": "Write a query that shows employee_name, department_id, salary, and their rank within their department (highest salary = rank 1). Use the employees table.",
  "solutionQuery": "SELECT employee_name, department_id, salary,\\n  RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank\\nFROM employees;"
}'::jsonb),

-- Question 10: Multiple Choice - CTEs
(1, 10, 'multiple_choice', 'advanced', ARRAY['CTEs'], 1.5,
'{
  "type": "multiple_choice",
  "question": "What keyword introduces a Common Table Expression (CTE)?",
  "options": ["TEMP", "WITH", "CREATE", "DEFINE"],
  "correctAnswer": 1,
  "explanation": "WITH is the keyword that introduces a CTE. CTEs provide a way to write more readable queries by naming subqueries."
}'::jsonb),

-- Question 11: Write Query - Subquery
(1, 11, 'write_query', 'advanced', ARRAY['Subqueries'], 2.0,
'{
  "type": "write_query",
  "question": "Find employees earning above the average salary",
  "description": "Write a query to select employee_name and salary for all employees whose salary is greater than the average salary across all employees.",
  "solutionQuery": "SELECT employee_name, salary\\nFROM employees\\nWHERE salary > (SELECT AVG(salary) FROM employees);"
}'::jsonb),

-- Question 12: Read Query - Window Functions
(1, 12, 'read_query', 'advanced', ARRAY['Window Functions'], 1.5,
'{
  "type": "read_query",
  "question": "What does LAG() do in this query?",
  "queryToRead": "SELECT date, sales,\\n  LAG(sales, 1) OVER (ORDER BY date) as previous_day_sales\\nFROM daily_sales;",
  "options": [
    "Gets the next day''s sales",
    "Gets the previous day''s sales",
    "Calculates the average sales",
    "Sums all previous sales"
  ],
  "correctAnswer": 1,
  "explanation": "LAG(sales, 1) retrieves the value from the previous row (1 row back) in the ordered result set, giving you the previous day''s sales."
}'::jsonb),

-- Question 13: Write Query - Self-Join
(1, 13, 'write_query', 'advanced', ARRAY['Self-Joins'], 2.0,
'{
  "type": "write_query",
  "question": "Find all employees and their managers",
  "description": "The employees table has columns: employee_id, employee_name, and manager_id (which references another employee_id). Write a query showing employee name and their manager''s name.",
  "solutionQuery": "SELECT e.employee_name as employee, m.employee_name as manager\\nFROM employees e\\nLEFT JOIN employees m ON e.manager_id = m.employee_id;"
}'::jsonb),

-- Question 14: Fill Blank - CASE statement
(1, 14, 'fill_blank', 'advanced', ARRAY['CASE Statements'], 1.5,
'{
  "type": "fill_blank",
  "question": "Complete the CASE statement to categorize products by price",
  "queryTemplate": "SELECT product_name, price,\\n  _____ \\n    WHEN price < 10 THEN ''Cheap''\\n    WHEN price < 50 THEN ''Moderate''\\n    ELSE ''Expensive''\\n  _____ as price_category\\nFROM products;",
  "blanks": [
    {
      "position": 0,
      "correctAnswer": "CASE",
      "acceptableAnswers": ["case"]
    },
    {
      "position": 1,
      "correctAnswer": "END",
      "acceptableAnswers": ["end"]
    }
  ],
  "explanation": "CASE statements must start with CASE and end with END. They provide conditional logic in SQL queries."
}'::jsonb),

-- Question 15: Write Query - CTE
(1, 15, 'write_query', 'advanced', ARRAY['CTEs', 'Aggregates'], 2.0,
'{
  "type": "write_query",
  "question": "Use a CTE to find departments with average salary above 50000",
  "description": "Write a query using a Common Table Expression (CTE) that calculates average salary per department, then selects departments where the average is above 50000.",
  "solutionQuery": "WITH dept_avg AS (\\n  SELECT department_id, AVG(salary) as avg_salary\\n  FROM employees\\n  GROUP BY department_id\\n)\\nSELECT department_id, avg_salary\\nFROM dept_avg\\nWHERE avg_salary > 50000;"
}'::jsonb);

-- Verify insertion
SELECT COUNT(*) as total_questions FROM assessment_questions WHERE assessment_id = 1;
