"""
Flashcard system based on SQL_Syntax_Cheat_Sheet.md
"""
import random

def _generate_options_for_card(card, ai_service=None):
    """Generate multiple choice options for a single flashcard"""
    # If card already has options, return as-is
    if card.get('options'):
        return card
        
    if ai_service is None:
        # If no AI service, return card with simple fallback options
        card_with_options = card.copy()
        card_with_options['options'] = [
            {'text': card['answer'], 'correct': True},
            {'text': 'Incorrect option 1', 'correct': False},
            {'text': 'Incorrect option 2', 'correct': False},
            {'text': 'Incorrect option 3', 'correct': False}
        ]
        random.shuffle(card_with_options['options'])
        return card_with_options
    
    try:
        # Generate 3 wrong answers using AI
        wrong_answers = ai_service.generate_wrong_answers(
            correct_answer=card['answer'],
            question=card['question'],
            topic=card['topic'],
            difficulty=card.get('level', 'basic')
        )
        
        # Create options array with correct answer + 3 wrong answers
        options = [
            {'text': card['answer'], 'correct': True}
        ]
        
        for wrong_answer in wrong_answers:
            options.append({'text': wrong_answer, 'correct': False})
        
        # Shuffle options randomly
        random.shuffle(options)
        
        # Add options to card
        card_with_options = card.copy()
        card_with_options['options'] = options
        return card_with_options
        
    except Exception as e:
        # Fallback if AI generation fails
        print(f"Error generating options for card {card.get('id', 'unknown')}: {e}")
        # Return card with simple fallback options
        card_with_options = card.copy()
        card_with_options['options'] = [
            {'text': card['answer'], 'correct': True},
            {'text': 'Incorrect option 1', 'correct': False},
            {'text': 'Incorrect option 2', 'correct': False},
            {'text': 'Incorrect option 3', 'correct': False}
        ]
        random.shuffle(card_with_options['options'])
        return card_with_options

def get_all_flashcards(ai_service=None):
    """Return all flashcards organized by difficulty level with multiple choice options"""
    
    base_flashcards = {
        "basic": [
            {
                "id": "basic_1",
                "topic": "Query Execution Order",
                "question": "What is the actual execution order of SQL clauses?",
                "answer": "FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT",
                "explanation": "SQL executes in a different order than it's written. Understanding this helps explain why you can't use SELECT aliases in WHERE, but can in ORDER BY.",
                "example": "-- You CANNOT do this:\nSELECT price * 1.1 AS new_price\nWHERE new_price > 100\n\n-- But you CAN do this:\nSELECT price * 1.1 AS new_price\nORDER BY new_price"
            },
            {
                "id": "basic_2",
                "topic": "SELECT DISTINCT",
                "question": "How do you remove duplicate rows from query results?",
                "answer": "SELECT DISTINCT",
                "explanation": "DISTINCT removes duplicate rows from the result set. It applies to all selected columns together.",
                "example": "SELECT DISTINCT city, state\nFROM customers;"
            },
            {
                "id": "basic_3",
                "topic": "WHERE Clause",
                "question": "What are the basic comparison operators in WHERE?",
                "answer": "= (equal), != or <> (not equal), >, >=, <, <=, BETWEEN, IN, NOT IN",
                "explanation": "These operators filter rows before any grouping occurs.",
                "example": "WHERE price >= 100\nWHERE category IN ('Electronics', 'Furniture')\nWHERE price BETWEEN 10 AND 50"
            },
            {
                "id": "basic_4",
                "topic": "LIKE Pattern Matching",
                "question": "What wildcards are used with LIKE for pattern matching?",
                "answer": "% (matches any number of characters), _ (matches single character)",
                "explanation": "LIKE is used for pattern matching with text. % is like * in file systems.",
                "example": "WHERE name LIKE 'John%'  -- Starts with John\nWHERE name LIKE '%son'  -- Ends with son\nWHERE name LIKE '%and%' -- Contains and\nWHERE name LIKE 'J_hn'  -- J, any char, hn"
            },
            {
                "id": "basic_5",
                "topic": "NULL Handling",
                "question": "How do you check for NULL values in SQL?",
                "answer": "IS NULL and IS NOT NULL (NOT = NULL, which doesn't work)",
                "explanation": "NULL is a special value meaning 'unknown'. You cannot use = or != with NULL.",
                "example": "WHERE email IS NULL\nWHERE phone IS NOT NULL"
            },
            {
                "id": "basic_6",
                "topic": "Logical Operators",
                "question": "What are the logical operators for combining conditions?",
                "answer": "AND (both conditions must be true), OR (at least one must be true), NOT (negation)",
                "explanation": "Use parentheses to control order of operations.",
                "example": "WHERE (city = 'NYC' OR city = 'LA') AND status = 'Active'"
            },
            {
                "id": "basic_7",
                "topic": "Table Aliases",
                "question": "How do you create and use table aliases?",
                "answer": "FROM table_name AS alias (AS is optional)",
                "explanation": "Aliases make queries shorter and more readable, especially with joins.",
                "example": "FROM customers AS c\nWHERE c.city = 'NYC'"
            },
            {
                "id": "basic_8",
                "topic": "Column Aliases",
                "question": "How do you create column aliases?",
                "answer": "SELECT column AS alias_name",
                "explanation": "Use quotes for aliases with spaces. AS keyword is optional but recommended for clarity.",
                "example": "SELECT \n    first_name AS name,\n    salary * 1.1 AS \"New Salary\""
            }
        ],
        "intermediate": [
            {
                "id": "inter_1",
                "topic": "INNER JOIN",
                "question": "What does an INNER JOIN return?",
                "answer": "Only rows that have matching values in both tables",
                "explanation": "INNER JOIN is the most restrictive join - if there's no match, the row is excluded.",
                "example": "SELECT *\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id"
            },
            {
                "id": "inter_2",
                "topic": "LEFT JOIN",
                "question": "What does a LEFT JOIN return?",
                "answer": "All rows from the left table, and matching rows from the right table (NULLs for non-matches)",
                "explanation": "LEFT JOIN keeps all rows from the first (left) table, even if there's no match in the second table.",
                "example": "SELECT *\nFROM customers c\nLEFT JOIN orders o ON c.customer_id = o.customer_id\n-- Shows all customers, even those with no orders"
            },
            {
                "id": "inter_3",
                "topic": "Self Join",
                "question": "What is a self join and when would you use it?",
                "answer": "A join of a table to itself, used for hierarchical relationships like employee-manager",
                "explanation": "Use different aliases to treat the same table as two separate tables.",
                "example": "SELECT \n    e.employee_name,\n    m.employee_name AS manager_name\nFROM employees e\nLEFT JOIN employees m ON e.manager_id = m.employee_id"
            },
            {
                "id": "inter_4",
                "topic": "COUNT Function",
                "question": "What's the difference between COUNT(*), COUNT(column), and COUNT(DISTINCT column)?",
                "answer": "COUNT(*) counts all rows, COUNT(column) counts non-NULL values, COUNT(DISTINCT column) counts unique non-NULL values",
                "explanation": "COUNT(*) includes NULLs, while COUNT(column) does not.",
                "example": "COUNT(*) -- Total rows\nCOUNT(email) -- Rows with email\nCOUNT(DISTINCT city) -- Unique cities"
            },
            {
                "id": "inter_5",
                "topic": "GROUP BY",
                "question": "What does GROUP BY do?",
                "answer": "Groups rows with the same values into summary rows, used with aggregate functions",
                "explanation": "Every column in SELECT must be either in GROUP BY or inside an aggregate function.",
                "example": "SELECT \n    category,\n    COUNT(*) AS count,\n    AVG(price) AS avg_price\nFROM products\nGROUP BY category"
            },
            {
                "id": "inter_6",
                "topic": "HAVING vs WHERE",
                "question": "What's the difference between WHERE and HAVING?",
                "answer": "WHERE filters rows before grouping, HAVING filters groups after grouping",
                "explanation": "Use WHERE for row-level filtering, HAVING for group-level filtering with aggregates.",
                "example": "SELECT category, SUM(sales) AS total\nFROM sales\nWHERE status = 'Completed'  -- Filter rows\nGROUP BY category\nHAVING SUM(sales) > 1000    -- Filter groups"
            },
            {
                "id": "inter_7",
                "topic": "Aggregate Functions",
                "question": "What are the main aggregate functions?",
                "answer": "SUM(), AVG(), COUNT(), MIN(), MAX()",
                "explanation": "These functions operate on sets of rows to produce a single result.",
                "example": "SELECT \n    SUM(amount) AS total,\n    AVG(amount) AS average,\n    MIN(amount) AS minimum,\n    MAX(amount) AS maximum\nFROM sales"
            },
            {
                "id": "inter_8",
                "topic": "Multiple Joins",
                "question": "How do you join more than two tables?",
                "answer": "Chain multiple JOIN clauses together",
                "explanation": "Each JOIN connects to tables already in the result set.",
                "example": "SELECT *\nFROM orders o\nJOIN customers c ON o.customer_id = c.customer_id\nJOIN products p ON o.product_id = p.product_id"
            }
        ],
        "advanced": [
            {
                "id": "adv_1",
                "topic": "Window Functions",
                "question": "What is the basic syntax of a window function?",
                "answer": "FUNCTION() OVER (PARTITION BY ... ORDER BY ... ROWS/RANGE ...)",
                "explanation": "Window functions perform calculations across related rows while keeping all rows in the result.",
                "example": "SUM(sales) OVER (\n    PARTITION BY category\n    ORDER BY date\n) AS running_total"
            },
            {
                "id": "adv_2",
                "topic": "ROW_NUMBER vs RANK",
                "question": "What's the difference between ROW_NUMBER(), RANK(), and DENSE_RANK()?",
                "answer": "ROW_NUMBER: 1,2,3,4 (unique), RANK: 1,2,2,4 (gaps after ties), DENSE_RANK: 1,2,2,3 (no gaps)",
                "explanation": "All are ranking functions but handle ties differently.",
                "example": "ROW_NUMBER() OVER (ORDER BY sales DESC) -- 1,2,3,4\nRANK() OVER (ORDER BY sales DESC)       -- 1,2,2,4\nDENSE_RANK() OVER (ORDER BY sales DESC) -- 1,2,2,3"
            },
            {
                "id": "adv_3",
                "topic": "LAG and LEAD",
                "question": "What do LAG() and LEAD() functions do?",
                "answer": "LAG() gets the previous row's value, LEAD() gets the next row's value",
                "explanation": "Useful for comparing values across rows, like month-over-month changes.",
                "example": "SELECT \n    date,\n    sales,\n    LAG(sales, 1) OVER (ORDER BY date) AS prev_sales,\n    LEAD(sales, 1) OVER (ORDER BY date) AS next_sales"
            },
            {
                "id": "adv_4",
                "topic": "Window Frames",
                "question": "What does ROWS BETWEEN do in window functions?",
                "answer": "Defines the specific rows included in the window calculation",
                "explanation": "Controls which rows are included relative to the current row.",
                "example": "-- 7-day moving average\nAVG(sales) OVER (\n    ORDER BY date\n    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW\n)"
            },
            {
                "id": "adv_5",
                "topic": "Common Table Expressions",
                "question": "What is a CTE and how do you create one?",
                "answer": "WITH cte_name AS (SELECT ...) - a named temporary result set",
                "explanation": "CTEs make complex queries more readable and can be referenced multiple times.",
                "example": "WITH high_value_customers AS (\n    SELECT customer_id, SUM(amount) AS total\n    FROM orders\n    GROUP BY customer_id\n    HAVING SUM(amount) > 10000\n)\nSELECT * FROM high_value_customers"
            },
            {
                "id": "adv_6",
                "topic": "Subqueries",
                "question": "Where can you use subqueries in SQL?",
                "answer": "In SELECT (scalar), FROM (derived table), WHERE (filtering), WITH clause (CTE)",
                "explanation": "Subqueries are queries nested inside other queries.",
                "example": "-- In SELECT\nSELECT name, \n    (SELECT AVG(salary) FROM employees) AS avg_salary\nFROM employees\n\n-- In WHERE\nWHERE salary > (SELECT AVG(salary) FROM employees)"
            },
            {
                "id": "adv_7",
                "topic": "EXISTS",
                "question": "What does EXISTS do and when should you use it?",
                "answer": "Tests if a subquery returns any rows; more efficient than IN for large datasets",
                "explanation": "EXISTS stops as soon as it finds one matching row, making it faster than IN for existence checks.",
                "example": "SELECT *\nFROM customers c\nWHERE EXISTS (\n    SELECT 1\n    FROM orders o\n    WHERE o.customer_id = c.customer_id\n)"
            },
            {
                "id": "adv_8",
                "topic": "Recursive CTEs",
                "question": "What are recursive CTEs used for?",
                "answer": "Hierarchical or tree-structured data, like organizational charts or bill of materials",
                "explanation": "Recursive CTEs have a base case and a recursive case that references itself.",
                "example": "WITH RECURSIVE hierarchy AS (\n    SELECT employee_id, name, manager_id, 1 AS level\n    FROM employees\n    WHERE manager_id IS NULL\n    UNION ALL\n    SELECT e.employee_id, e.name, e.manager_id, h.level + 1\n    FROM employees e\n    JOIN hierarchy h ON e.manager_id = h.employee_id\n)\nSELECT * FROM hierarchy"
            }
        ],
        "expert": [
            {
                "id": "exp_1",
                "topic": "Running Total",
                "question": "How do you calculate a running total?",
                "answer": "SUM(value) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)",
                "explanation": "Running total accumulates values from the start to the current row.",
                "example": "SELECT \n    date,\n    sales,\n    SUM(sales) OVER (\n        ORDER BY date\n        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n    ) AS running_total"
            },
            {
                "id": "exp_2",
                "topic": "Moving Average",
                "question": "How do you calculate a 7-day moving average?",
                "answer": "AVG(value) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)",
                "explanation": "Moving average includes the current row and N-1 preceding rows.",
                "example": "SELECT \n    date,\n    sales,\n    AVG(sales) OVER (\n        ORDER BY date\n        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW\n    ) AS moving_avg_7day"
            },
            {
                "id": "exp_3",
                "topic": "Percent of Total",
                "question": "How do you calculate percent of total using window functions?",
                "answer": "(value / SUM(value) OVER ()) * 100",
                "explanation": "Empty OVER() clause creates a window over all rows.",
                "example": "SELECT \n    category,\n    sales,\n    (sales / SUM(sales) OVER ()) * 100 AS pct_of_total\nFROM sales"
            },
            {
                "id": "exp_4",
                "topic": "Year-over-Year Calculation",
                "question": "What's the formula for year-over-year variance percentage?",
                "answer": "((current_year - prior_year) / prior_year) * 100",
                "explanation": "Shows percentage change from prior year to current year.",
                "example": "SELECT \n    week,\n    cy_sales,\n    py_sales,\n    ((cy_sales - py_sales) / py_sales) * 100 AS yoy_variance\nFROM sales_comparison"
            },
            {
                "id": "exp_5",
                "topic": "UNION vs UNION ALL",
                "question": "What's the difference between UNION and UNION ALL?",
                "answer": "UNION removes duplicates (slower), UNION ALL keeps all rows including duplicates (faster)",
                "explanation": "Use UNION ALL when duplicates don't matter for better performance.",
                "example": "SELECT city FROM customers\nUNION ALL  -- Faster\nSELECT city FROM suppliers"
            },
            {
                "id": "exp_6",
                "topic": "Date Functions",
                "question": "How do you extract year, month, and day from a date?",
                "answer": "YEAR(date), MONTH(date), DAY(date) or EXTRACT(YEAR FROM date)",
                "explanation": "Different SQL databases have slightly different syntax.",
                "example": "SELECT \n    YEAR(order_date) AS year,\n    MONTH(order_date) AS month,\n    DAY(order_date) AS day\nFROM orders"
            },
            {
                "id": "exp_7",
                "topic": "CASE Statements",
                "question": "What are the two types of CASE statements?",
                "answer": "Simple CASE (tests one column) and Searched CASE (tests multiple conditions)",
                "explanation": "Searched CASE is more flexible and commonly used.",
                "example": "-- Simple CASE\nCASE status\n    WHEN 'A' THEN 'Active'\n    WHEN 'I' THEN 'Inactive'\nEND\n\n-- Searched CASE\nCASE\n    WHEN sales > 1000 THEN 'High'\n    WHEN sales > 500 THEN 'Medium'\n    ELSE 'Low'\nEND"
            },
            {
                "id": "exp_8",
                "topic": "COALESCE",
                "question": "What does COALESCE do?",
                "answer": "Returns the first non-NULL value from a list of expressions",
                "explanation": "Useful for providing default values when data might be NULL.",
                "example": "SELECT \n    name,\n    COALESCE(phone, email, 'No contact') AS contact\nFROM customers"
            },
            {
                "id": "exp_9",
                "topic": "String Functions",
                "question": "What are the main string manipulation functions?",
                "answer": "UPPER, LOWER, SUBSTRING, CONCAT, TRIM, REPLACE, LENGTH",
                "explanation": "These functions modify or extract information from strings.",
                "example": "SELECT \n    UPPER(name) AS upper_name,\n    SUBSTRING(email, 1, 5) AS email_prefix,\n    CONCAT(first_name, ' ', last_name) AS full_name"
            },
            {
                "id": "exp_10",
                "topic": "Performance Optimization",
                "question": "What are key SQL performance best practices?",
                "answer": "Index JOIN/WHERE columns, filter early with WHERE, avoid SELECT *, use EXISTS over IN, use UNION ALL when possible",
                "explanation": "Small changes can dramatically improve query performance.",
                "example": "-- Good\nSELECT id, name\nWHERE status = 'Active'\n\n-- Bad\nSELECT *\n-- No WHERE clause"
            }
        ]
    }
    
    # Add level information to each card
    # Only generate options if AI service is provided AND requested
    result = {}
    for level, cards in base_flashcards.items():
        result[level] = []
        for card in cards:
            card_with_level = card.copy()
            card_with_level['level'] = level
            # Don't generate options upfront - they'll be generated lazily via API
            # Only add options if ai_service is provided (for backward compatibility)
            if ai_service is not None:
                card_with_options = _generate_options_for_card(card_with_level, ai_service)
                result[level].append(card_with_options)
            else:
                # Return card without options - will be generated on demand
                result[level].append(card_with_level)
    
    return result
