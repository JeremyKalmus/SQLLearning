/**
 * Seed script for Tutorials Feature
 * Creates tutorials for all SQL topics across all difficulty tiers
 *
 * Usage: node scripts/seed-tutorials.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// BASIC TUTORIALS (5)
// ============================================================================

// 1. SELECT Fundamentals
const selectFundamentalsTutorial = {
  slug: 'select-fundamentals',
  title: 'SELECT Statement Fundamentals',
  description: 'Learn the foundation of SQL queries: retrieving data from tables using SELECT',
  difficulty_tier: 'basic',
  topic: 'SELECT Fundamentals',
  prerequisites: [],
  order_index: 1,
  estimated_time_minutes: 20,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'Understanding SELECT',
        order: 1,
        content: {
          text: `The SELECT statement is the most fundamental command in SQL. It allows you to retrieve data from database tables. Every query starts with SELECT, and mastering it is essential for working with databases.`,
          keyPoints: [
            'SELECT retrieves data from one or more columns',
            'Use * to select all columns',
            'Specify column names for targeted data retrieval',
            'SELECT is the foundation of all SQL queries'
          ],
          useCases: [
            'Viewing data in a table',
            'Extracting specific columns for reports',
            'Combining with other clauses for complex queries',
            'Analyzing data patterns'
          ]
        }
      },
      {
        type: 'example',
        title: 'Basic SELECT Syntax',
        order: 2,
        content: {
          description: 'Let\'s retrieve data from a products table',
          query: `-- Select all columns
SELECT * FROM products;

-- Select specific columns
SELECT product_name, price, category
FROM products;

-- Select with simple expressions
SELECT
  product_name,
  price,
  price * 1.1 as price_with_tax
FROM products;`,
          explanation: 'The first query retrieves all columns using *. The second selects specific columns. The third shows how you can perform calculations and use aliases with AS.',
          annotations: [
            { line: 2, text: 'The * means "select all columns"' },
            { line: 5, text: 'List specific columns separated by commas' },
            { line: 11, text: 'Perform calculations and create new columns with AS' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice writing SELECT statements',
          starterQuery: `SELECT * FROM customers;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Select only first_name and email columns',
              hint: 'Replace * with the column names separated by commas'
            },
            {
              taskNumber: 2,
              instruction: 'Add a calculation that doubles a numeric column',
              hint: 'Use column_name * 2 AS new_column_name'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'SELECT is the command to retrieve data',
            'Use * for all columns, or list specific column names',
            'Perform calculations directly in SELECT',
            'Use AS to create column aliases'
          ],
          nextSteps: [
            'Learn WHERE clause to filter data',
            'Explore ORDER BY to sort results',
            'Practice combining SELECT with other SQL clauses'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// 2. WHERE Clause
const whereClauseTutorial = {
  slug: 'where-clause-basics',
  title: 'Filtering Data with WHERE',
  description: 'Master the WHERE clause to filter rows and find exactly the data you need',
  difficulty_tier: 'basic',
  topic: 'WHERE Clause',
  prerequisites: [],
  order_index: 2,
  estimated_time_minutes: 25,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'What is the WHERE Clause?',
        order: 1,
        content: {
          text: `The WHERE clause filters rows based on conditions you specify. Instead of returning all rows, WHERE lets you retrieve only the data that meets your criteria. It's one of the most powerful and frequently used SQL clauses.`,
          keyPoints: [
            'Filter rows based on conditions',
            'Use comparison operators (=, <, >, <=, >=, !=)',
            'Combine conditions with AND, OR, NOT',
            'Works with numbers, text, and dates'
          ],
          useCases: [
            'Finding customers in a specific city',
            'Getting products within a price range',
            'Filtering orders by date',
            'Finding records with specific attributes'
          ]
        }
      },
      {
        type: 'example',
        title: 'WHERE Clause Examples',
        order: 2,
        content: {
          description: 'Common WHERE clause patterns',
          query: `-- Simple comparison
SELECT * FROM products
WHERE price > 50;

-- Text matching
SELECT * FROM customers
WHERE city = 'New York';

-- Multiple conditions with AND
SELECT * FROM orders
WHERE total_amount > 100 AND status = 'shipped';

-- Multiple conditions with OR
SELECT * FROM products
WHERE category = 'Electronics' OR category = 'Computers';

-- Using IN for multiple values
SELECT * FROM customers
WHERE country IN ('USA', 'Canada', 'Mexico');`,
          explanation: 'The WHERE clause goes after FROM and before ORDER BY. Use comparison operators for numbers and = for exact text matches. AND requires all conditions to be true, while OR requires at least one.',
          annotations: [
            { line: 2, text: 'Filter numeric values with comparison operators' },
            { line: 9, text: 'AND requires both conditions to be true' },
            { line: 13, text: 'OR requires at least one condition to be true' },
            { line: 17, text: 'IN checks if value is in a list' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice filtering data with WHERE',
          starterQuery: `SELECT product_name, price, category
FROM products
WHERE price > 25;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Modify to find products between $25 and $100',
              hint: 'Use AND with two conditions: price > 25 AND price < 100'
            },
            {
              taskNumber: 2,
              instruction: 'Add a condition to filter by category',
              hint: 'Add AND category = \'some_category\' to the WHERE clause'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'WHERE filters rows based on conditions',
            'Use =, <, >, <=, >=, != for comparisons',
            'Combine conditions with AND, OR, NOT',
            'IN checks membership in a list'
          ],
          nextSteps: [
            'Learn about LIKE for pattern matching',
            'Explore BETWEEN for range queries',
            'Practice complex condition combinations'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// 3. ORDER BY
const orderByTutorial = {
  slug: 'order-by-sorting',
  title: 'Sorting Results with ORDER BY',
  description: 'Learn how to sort query results in ascending or descending order',
  difficulty_tier: 'basic',
  topic: 'ORDER BY',
  prerequisites: [],
  order_index: 3,
  estimated_time_minutes: 15,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'Why Sort Data?',
        order: 1,
        content: {
          text: `The ORDER BY clause sorts query results based on one or more columns. By default, databases return rows in an arbitrary order. ORDER BY gives you control over how results are presented, making data easier to analyze and understand.`,
          keyPoints: [
            'Sort results in ascending (ASC) or descending (DESC) order',
            'Sort by multiple columns',
            'Works with numbers, text, and dates',
            'Applied last in query execution'
          ],
          useCases: [
            'Finding the most expensive products',
            'Sorting customers alphabetically',
            'Ordering transactions by date',
            'Ranking items by priority or importance'
          ]
        }
      },
      {
        type: 'example',
        title: 'ORDER BY Examples',
        order: 2,
        content: {
          description: 'Different ways to sort your data',
          query: `-- Sort by one column (ascending by default)
SELECT product_name, price
FROM products
ORDER BY price;

-- Sort descending
SELECT product_name, price
FROM products
ORDER BY price DESC;

-- Sort by multiple columns
SELECT product_name, category, price
FROM products
ORDER BY category ASC, price DESC;

-- Sort by column position
SELECT product_name, price
FROM products
ORDER BY 2 DESC;`,
          explanation: 'ORDER BY comes at the end of your query. ASC is default (low to high). DESC reverses the order (high to low). When sorting by multiple columns, it sorts by the first column, then uses the second column to break ties.',
          annotations: [
            { line: 4, text: 'ASC is default - sorts from lowest to highest' },
            { line: 9, text: 'DESC sorts from highest to lowest' },
            { line: 14, text: 'Sort by category first, then by price within each category' },
            { line: 19, text: 'Can use column position (2 = second column)' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice sorting data',
          starterQuery: `SELECT first_name, last_name, city
FROM customers
ORDER BY last_name;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Sort by city first, then by last_name',
              hint: 'Use ORDER BY city, last_name'
            },
            {
              taskNumber: 2,
              instruction: 'Change to sort city in descending order',
              hint: 'Add DESC after city: ORDER BY city DESC, last_name'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'ORDER BY sorts query results',
            'ASC (ascending) is default, DESC sorts descending',
            'Can sort by multiple columns',
            'Goes at the end of your query'
          ],
          nextSteps: [
            'Combine ORDER BY with WHERE for filtered sorted results',
            'Learn about LIMIT to get top N results',
            'Practice sorting with calculated columns'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// 4. DISTINCT
const distinctTutorial = {
  slug: 'distinct-unique-values',
  title: 'Finding Unique Values with DISTINCT',
  description: 'Use DISTINCT to eliminate duplicate rows and find unique values in your data',
  difficulty_tier: 'basic',
  topic: 'DISTINCT',
  prerequisites: [],
  order_index: 4,
  estimated_time_minutes: 15,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'What is DISTINCT?',
        order: 1,
        content: {
          text: `DISTINCT removes duplicate rows from your query results, showing only unique values. It's essential for data exploration, finding unique categories, and understanding the variety of data in your tables.`,
          keyPoints: [
            'Removes duplicate rows from results',
            'Shows only unique values',
            'Works with single or multiple columns',
            'Useful for data exploration and analysis'
          ],
          useCases: [
            'Finding all unique categories in a product table',
            'Listing all cities where customers are located',
            'Identifying unique order statuses',
            'Counting distinct values'
          ]
        }
      },
      {
        type: 'example',
        title: 'Using DISTINCT',
        order: 2,
        content: {
          description: 'Examples of DISTINCT usage',
          query: `-- Get unique categories
SELECT DISTINCT category
FROM products;

-- Get unique combinations
SELECT DISTINCT city, state
FROM customers;

-- Count distinct values
SELECT COUNT(DISTINCT customer_id) as unique_customers
FROM orders;

-- Compare with and without DISTINCT
SELECT category FROM products;  -- May have duplicates
SELECT DISTINCT category FROM products;  -- Only unique values`,
          explanation: 'DISTINCT goes right after SELECT. When used with multiple columns, it finds unique combinations of those columns. COUNT(DISTINCT column) counts how many unique values exist.',
          annotations: [
            { line: 2, text: 'DISTINCT removes duplicate categories' },
            { line: 6, text: 'Finds unique city/state combinations' },
            { line: 10, text: 'COUNT(DISTINCT) counts unique values only' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice using DISTINCT',
          starterQuery: `SELECT country
FROM customers;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Add DISTINCT to show only unique countries',
              hint: 'Put DISTINCT right after SELECT'
            },
            {
              taskNumber: 2,
              instruction: 'Show unique combinations of country and city',
              hint: 'Use SELECT DISTINCT country, city'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'DISTINCT removes duplicate rows',
            'Place it right after SELECT',
            'Works with single or multiple columns',
            'COUNT(DISTINCT) counts unique values'
          ],
          nextSteps: [
            'Combine DISTINCT with WHERE to filter before deduplication',
            'Use with ORDER BY to sort unique values',
            'Learn when DISTINCT is needed vs when it\'s redundant'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// 5. NULL Handling
const nullHandlingTutorial = {
  slug: 'null-handling',
  title: 'Working with NULL Values',
  description: 'Understand NULL values and learn how to handle missing data in SQL',
  difficulty_tier: 'basic',
  topic: 'NULL Handling',
  prerequisites: [],
  order_index: 5,
  estimated_time_minutes: 20,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'Understanding NULL',
        order: 1,
        content: {
          text: `NULL represents missing or unknown data in SQL. It's not zero, not an empty string, but the absence of a value. Understanding NULL is crucial because it behaves differently than other values and requires special handling.`,
          keyPoints: [
            'NULL means missing or unknown data',
            'NULL is not equal to anything, including NULL',
            'Use IS NULL and IS NOT NULL to check for NULL',
            'Many functions handle NULL specially'
          ],
          useCases: [
            'Finding records with missing information',
            'Filtering out incomplete data',
            'Providing default values for missing data',
            'Validating data completeness'
          ]
        }
      },
      {
        type: 'example',
        title: 'Working with NULL',
        order: 2,
        content: {
          description: 'How to handle NULL values',
          query: `-- Find NULL values (correct way)
SELECT * FROM customers
WHERE phone IS NULL;

-- This WON'T work (NULL = NULL is always false)
SELECT * FROM customers
WHERE phone = NULL;  -- Wrong!

-- Find non-NULL values
SELECT * FROM customers
WHERE email IS NOT NULL;

-- Replace NULL with a default value
SELECT
  first_name,
  COALESCE(phone, 'No phone') as phone_display
FROM customers;

-- Count excluding NULLs
SELECT COUNT(phone) as customers_with_phones
FROM customers;`,
          explanation: 'You cannot use = or != with NULL. Use IS NULL or IS NOT NULL instead. COALESCE returns the first non-NULL value. Aggregate functions like COUNT ignore NULL values.',
          annotations: [
            { line: 3, text: 'IS NULL is the correct way to check for NULL' },
            { line: 6, text: 'This is WRONG - never use = NULL' },
            { line: 10, text: 'IS NOT NULL finds rows with values' },
            { line: 15, text: 'COALESCE provides a default when value is NULL' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice handling NULL values',
          starterQuery: `SELECT product_name, description, price
FROM products
WHERE description IS NULL;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Find products that HAVE a description',
              hint: 'Change IS NULL to IS NOT NULL'
            },
            {
              taskNumber: 2,
              instruction: 'Use COALESCE to show "No description" when description is NULL',
              hint: 'Use COALESCE(description, \'No description\') in SELECT'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'NULL represents missing or unknown data',
            'Use IS NULL and IS NOT NULL (never = or !=)',
            'COALESCE provides default values for NULL',
            'Aggregate functions typically ignore NULL'
          ],
          nextSteps: [
            'Learn about NULLIF to create NULL values conditionally',
            'Explore how JOINs handle NULL',
            'Practice NULL handling in calculations'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// ============================================================================
// INTERMEDIATE TUTORIALS (5)
// ============================================================================

// 6. JOINs
const joinsTutorial = {
  slug: 'sql-joins',
  title: 'Combining Tables with JOINs',
  description: 'Master INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL JOIN to combine data from multiple tables',
  difficulty_tier: 'intermediate',
  topic: 'JOINs',
  prerequisites: [],
  order_index: 6,
  estimated_time_minutes: 35,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'Why JOINs?',
        order: 1,
        content: {
          text: `JOINs combine rows from two or more tables based on related columns. In relational databases, data is split across multiple tables to reduce redundancy. JOINs let you query this related data together, forming complete pictures from separate pieces.`,
          keyPoints: [
            'Combine data from multiple tables',
            'Based on matching column values',
            'Four main types: INNER, LEFT, RIGHT, FULL',
            'Essential for working with normalized databases'
          ],
          useCases: [
            'Getting customer names with their orders',
            'Showing product details with order information',
            'Finding all records with or without matches',
            'Combining related data for reports'
          ]
        }
      },
      {
        type: 'example',
        title: 'Types of JOINs',
        order: 2,
        content: {
          description: 'Understanding different JOIN types',
          query: `-- INNER JOIN - only matching rows from both tables
SELECT
  customers.first_name,
  customers.last_name,
  orders.order_id,
  orders.total_amount
FROM customers
INNER JOIN orders ON customers.customer_id = orders.customer_id;

-- LEFT JOIN - all from left table, matching from right
SELECT
  customers.first_name,
  orders.order_id
FROM customers
LEFT JOIN orders ON customers.customer_id = orders.customer_id;
-- Shows all customers, even those without orders (order_id will be NULL)

-- Multiple JOINs
SELECT
  customers.first_name,
  orders.order_id,
  products.product_name
FROM customers
INNER JOIN orders ON customers.customer_id = orders.customer_id
INNER JOIN order_items ON orders.order_id = order_items.order_id
INNER JOIN products ON order_items.product_id = products.product_id;`,
          explanation: 'INNER JOIN returns only rows that have matches in both tables. LEFT JOIN returns all rows from the left table and matching rows from the right (with NULL for non-matches). You can chain multiple JOINs to combine many tables.',
          annotations: [
            { line: 8, text: 'ON specifies how tables are related' },
            { line: 14, text: 'LEFT JOIN keeps all rows from customers' },
            { line: 23, text: 'Chain multiple JOINs to combine many tables' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice writing JOINs',
          starterQuery: `SELECT
  c.first_name,
  c.last_name,
  o.order_id
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Change to LEFT JOIN to see all customers',
              hint: 'Replace INNER JOIN with LEFT JOIN'
            },
            {
              taskNumber: 2,
              instruction: 'Add a WHERE clause to show only customers without orders',
              hint: 'With LEFT JOIN, use WHERE o.order_id IS NULL'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'INNER JOIN returns only matching rows',
            'LEFT JOIN keeps all rows from left table',
            'RIGHT JOIN keeps all rows from right table',
            'Use ON to specify the join condition',
            'Can chain multiple JOINs together'
          ],
          nextSteps: [
            'Learn about FULL OUTER JOIN',
            'Practice self-joins',
            'Explore CROSS JOIN for Cartesian products'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// 7. Aggregates
const aggregatesTutorial = {
  slug: 'aggregate-functions',
  title: 'Aggregate Functions',
  description: 'Learn COUNT, SUM, AVG, MIN, MAX to summarize and analyze your data',
  difficulty_tier: 'intermediate',
  topic: 'Aggregates',
  prerequisites: [],
  order_index: 7,
  estimated_time_minutes: 25,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'What are Aggregate Functions?',
        order: 1,
        content: {
          text: `Aggregate functions perform calculations on multiple rows and return a single result. They're essential for data analysis, letting you calculate totals, averages, counts, and find minimum or maximum values across your data.`,
          keyPoints: [
            'Calculate values across multiple rows',
            'Return single summary values',
            'Five main functions: COUNT, SUM, AVG, MIN, MAX',
            'Ignore NULL values (except COUNT(*))'
          ],
          useCases: [
            'Calculating total sales',
            'Finding average order value',
            'Counting customers or orders',
            'Finding highest and lowest prices'
          ]
        }
      },
      {
        type: 'example',
        title: 'Common Aggregate Functions',
        order: 2,
        content: {
          description: 'Using different aggregate functions',
          query: `-- Count rows
SELECT COUNT(*) as total_orders
FROM orders;

-- Count non-NULL values
SELECT COUNT(phone) as customers_with_phones
FROM customers;

-- Sum values
SELECT SUM(total_amount) as total_revenue
FROM orders;

-- Calculate average
SELECT AVG(price) as average_price
FROM products;

-- Find minimum and maximum
SELECT
  MIN(price) as cheapest,
  MAX(price) as most_expensive
FROM products;

-- Combine multiple aggregates
SELECT
  COUNT(*) as total_products,
  AVG(price) as avg_price,
  MIN(price) as min_price,
  MAX(price) as max_price,
  SUM(stock_quantity) as total_inventory
FROM products;`,
          explanation: 'COUNT(*) counts all rows including NULLs. COUNT(column) counts non-NULL values. SUM and AVG work with numbers. MIN and MAX work with numbers, dates, and text. You can use multiple aggregates in one query.',
          annotations: [
            { line: 2, text: 'COUNT(*) counts all rows' },
            { line: 6, text: 'COUNT(column) counts non-NULL values only' },
            { line: 10, text: 'SUM adds up all values' },
            { line: 14, text: 'AVG calculates the mean' },
            { line: 25, text: 'Can combine multiple aggregates' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice using aggregate functions',
          starterQuery: `SELECT
  COUNT(*) as total_orders,
  SUM(total_amount) as revenue
FROM orders;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Add AVG, MIN, and MAX for total_amount',
              hint: 'Add AVG(total_amount), MIN(total_amount), MAX(total_amount) to SELECT'
            },
            {
              taskNumber: 2,
              instruction: 'Add a WHERE clause to only include shipped orders',
              hint: 'Add WHERE status = \'shipped\' before the aggregation'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'Aggregate functions summarize multiple rows into one value',
            'COUNT(*) counts all rows, COUNT(column) counts non-NULLs',
            'SUM and AVG work with numeric values',
            'MIN and MAX work with numbers, dates, and text',
            'Can combine multiple aggregates in one query'
          ],
          nextSteps: [
            'Learn GROUP BY to aggregate within groups',
            'Explore HAVING to filter aggregated results',
            'Practice using DISTINCT with aggregates'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// 8. GROUP BY
const groupByTutorial = {
  slug: 'group-by-basics',
  title: 'Grouping Data with GROUP BY',
  description: 'Use GROUP BY to calculate aggregates for each category or group in your data',
  difficulty_tier: 'intermediate',
  topic: 'GROUP BY',
  prerequisites: [],
  order_index: 8,
  estimated_time_minutes: 30,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'What is GROUP BY?',
        order: 1,
        content: {
          text: `GROUP BY divides rows into groups based on column values and performs aggregate calculations for each group. Instead of one total for all rows, you get a total for each category. It's essential for category-level analysis and reporting.`,
          keyPoints: [
            'Divides rows into groups',
            'Performs aggregates for each group',
            'Must include all non-aggregated columns',
            'Works with any aggregate function'
          ],
          useCases: [
            'Sales by category or region',
            'Average rating by product',
            'Order count by customer',
            'Revenue by month or quarter'
          ]
        }
      },
      {
        type: 'example',
        title: 'GROUP BY Examples',
        order: 2,
        content: {
          description: 'Grouping and aggregating data',
          query: `-- Count products by category
SELECT
  category,
  COUNT(*) as product_count
FROM products
GROUP BY category;

-- Sales by customer
SELECT
  customer_id,
  COUNT(*) as order_count,
  SUM(total_amount) as total_spent,
  AVG(total_amount) as avg_order_value
FROM orders
GROUP BY customer_id
ORDER BY total_spent DESC;

-- Group by multiple columns
SELECT
  category,
  supplier_id,
  COUNT(*) as product_count,
  AVG(price) as avg_price
FROM products
GROUP BY category, supplier_id
ORDER BY category, supplier_id;

-- With column aliases (some databases)
SELECT
  EXTRACT(YEAR FROM order_date) as year,
  EXTRACT(MONTH FROM order_date) as month,
  SUM(total_amount) as monthly_revenue
FROM orders
GROUP BY year, month
ORDER BY year, month;`,
          explanation: 'GROUP BY comes after WHERE and before ORDER BY. All columns in SELECT must either be in GROUP BY or used with an aggregate function. You can group by multiple columns to create nested groups.',
          annotations: [
            { line: 6, text: 'GROUP BY the column(s) you want to group by' },
            { line: 15, text: 'Can combine multiple aggregates with GROUP BY' },
            { line: 24, text: 'Group by multiple columns for nested grouping' },
            { line: 33, text: 'Can group by expressions and use aliases' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice using GROUP BY',
          starterQuery: `SELECT
  category,
  COUNT(*) as product_count
FROM products
GROUP BY category;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Add AVG(price) to see average price per category',
              hint: 'Add AVG(price) as avg_price to the SELECT list'
            },
            {
              taskNumber: 2,
              instruction: 'Add ORDER BY to sort by product_count descending',
              hint: 'Add ORDER BY product_count DESC after GROUP BY'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'GROUP BY divides rows into groups for aggregation',
            'All non-aggregated SELECT columns must be in GROUP BY',
            'Can group by multiple columns',
            'Combine with ORDER BY to sort grouped results'
          ],
          nextSteps: [
            'Learn HAVING to filter grouped results',
            'Practice grouping by date/time expressions',
            'Explore ROLLUP and CUBE for subtotals'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// 9. HAVING
const havingTutorial = {
  slug: 'having-clause',
  title: 'Filtering Groups with HAVING',
  description: 'Learn how to filter aggregated results using the HAVING clause',
  difficulty_tier: 'intermediate',
  topic: 'HAVING',
  prerequisites: [],
  order_index: 9,
  estimated_time_minutes: 20,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'WHERE vs HAVING',
        order: 1,
        content: {
          text: `HAVING filters groups after aggregation, while WHERE filters rows before aggregation. Use WHERE to filter individual rows and HAVING to filter aggregated results. HAVING is essential when you need to filter based on aggregate values like totals or counts.`,
          keyPoints: [
            'Filters groups after GROUP BY',
            'Works with aggregate functions',
            'WHERE filters before grouping, HAVING after',
            'Often used with COUNT, SUM, AVG, etc.'
          ],
          useCases: [
            'Finding customers with more than X orders',
            'Categories with average price above threshold',
            'Regions with total sales exceeding target',
            'Products ordered more than N times'
          ]
        }
      },
      {
        type: 'example',
        title: 'Using HAVING',
        order: 2,
        content: {
          description: 'Filtering grouped results',
          query: `-- Find customers with more than 3 orders
SELECT
  customer_id,
  COUNT(*) as order_count
FROM orders
GROUP BY customer_id
HAVING COUNT(*) > 3
ORDER BY order_count DESC;

-- Categories with average price over $50
SELECT
  category,
  AVG(price) as avg_price,
  COUNT(*) as product_count
FROM products
GROUP BY category
HAVING AVG(price) > 50;

-- Combining WHERE and HAVING
SELECT
  category,
  COUNT(*) as expensive_products
FROM products
WHERE price > 100  -- Filter rows first
GROUP BY category
HAVING COUNT(*) >= 5  -- Then filter groups
ORDER BY expensive_products DESC;

-- Multiple HAVING conditions
SELECT
  customer_id,
  COUNT(*) as order_count,
  SUM(total_amount) as total_spent
FROM orders
GROUP BY customer_id
HAVING COUNT(*) > 5 AND SUM(total_amount) > 1000;`,
          explanation: 'HAVING comes after GROUP BY. WHERE filters individual rows before grouping. HAVING filters groups after aggregation. You can use multiple conditions in HAVING with AND/OR.',
          annotations: [
            { line: 7, text: 'HAVING filters aggregated results' },
            { line: 17, text: 'Can filter by any aggregate' },
            { line: 24, text: 'WHERE filters rows before grouping' },
            { line: 26, text: 'HAVING filters the grouped results' },
            { line: 36, text: 'Multiple conditions with AND/OR' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice filtering with HAVING',
          starterQuery: `SELECT
  category,
  COUNT(*) as product_count,
  AVG(price) as avg_price
FROM products
GROUP BY category;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Add HAVING to show only categories with more than 10 products',
              hint: 'Add HAVING COUNT(*) > 10 after GROUP BY'
            },
            {
              taskNumber: 2,
              instruction: 'Add another condition: average price must be over $25',
              hint: 'Use AND in HAVING: HAVING COUNT(*) > 10 AND AVG(price) > 25'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'HAVING filters groups after aggregation',
            'WHERE filters rows before grouping',
            'HAVING works with aggregate functions',
            'Can combine multiple conditions with AND/OR'
          ],
          nextSteps: [
            'Practice complex queries with WHERE and HAVING',
            'Compare performance of WHERE vs HAVING',
            'Learn when to use subqueries vs HAVING'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// 10. Multiple Tables
const multipleTablesTutorial = {
  slug: 'working-with-multiple-tables',
  title: 'Working with Multiple Tables',
  description: 'Master techniques for querying and combining data across multiple related tables',
  difficulty_tier: 'intermediate',
  topic: 'Multiple Tables',
  prerequisites: [],
  order_index: 10,
  estimated_time_minutes: 35,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'Relational Database Basics',
        order: 1,
        content: {
          text: `Relational databases store data across multiple related tables to reduce redundancy and maintain data integrity. Learning to work with multiple tables is essential for real-world SQL, as business data is rarely contained in a single table.`,
          keyPoints: [
            'Data is split across multiple tables',
            'Tables are related through keys (foreign keys)',
            'Use JOINs to combine related data',
            'Can combine JOINs with WHERE, GROUP BY, etc.'
          ],
          useCases: [
            'Customer orders with product details',
            'Employee assignments to departments',
            'Products with categories and suppliers',
            'Complex reporting across the database'
          ]
        }
      },
      {
        type: 'example',
        title: 'Multi-Table Query Patterns',
        order: 2,
        content: {
          description: 'Common patterns for working with multiple tables',
          query: `-- Three-table join: Customers, Orders, Order Items
SELECT
  c.first_name,
  c.last_name,
  o.order_id,
  o.order_date,
  oi.quantity,
  p.product_name,
  (oi.quantity * oi.unit_price) as line_total
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.order_date >= '2024-01-01'
ORDER BY c.last_name, o.order_date;

-- Aggregating across tables
SELECT
  c.customer_id,
  c.first_name,
  c.last_name,
  COUNT(DISTINCT o.order_id) as total_orders,
  SUM(oi.quantity * oi.unit_price) as lifetime_value
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY c.customer_id, c.first_name, c.last_name
HAVING COUNT(DISTINCT o.order_id) > 0
ORDER BY lifetime_value DESC;

-- Complex filtering across tables
SELECT
  p.product_name,
  p.category,
  COUNT(DISTINCT o.customer_id) as unique_customers,
  SUM(oi.quantity) as total_sold
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.status = 'completed'
  AND o.order_date >= DATE('now', '-1 year')
GROUP BY p.product_id, p.product_name, p.category
HAVING SUM(oi.quantity) > 100
ORDER BY total_sold DESC;`,
          explanation: 'Chain multiple JOINs to combine many tables. Use table aliases (c, o, oi, p) for brevity. Combine JOINs with WHERE, GROUP BY, HAVING, and ORDER BY for complex analysis. Use LEFT JOIN to include records without matches.',
          annotations: [
            { line: 10, text: 'Use aliases (c, o, oi, p) for readability' },
            { line: 11, text: 'Chain JOINs to connect multiple tables' },
            { line: 22, text: 'COUNT(DISTINCT) prevents double-counting' },
            { line: 24, text: 'LEFT JOIN keeps all customers' },
            { line: 38, text: 'Combine WHERE, GROUP BY, and HAVING' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice multi-table queries',
          starterQuery: `SELECT
  c.first_name,
  c.last_name,
  COUNT(o.order_id) as order_count
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Add SUM(o.total_amount) to calculate total spent',
              hint: 'Add SUM(o.total_amount) as total_spent to SELECT'
            },
            {
              taskNumber: 2,
              instruction: 'Add HAVING to show only customers with 3+ orders',
              hint: 'Add HAVING COUNT(o.order_id) >= 3 after GROUP BY'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'Real-world data spans multiple related tables',
            'Chain JOINs to combine many tables',
            'Use table aliases for readability',
            'Combine JOINs with WHERE, GROUP BY, HAVING, ORDER BY',
            'LEFT JOIN includes unmatched records'
          ],
          nextSteps: [
            'Practice complex multi-table reports',
            'Learn about database normalization',
            'Explore query optimization for joins'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// ============================================================================
// ADVANCED TUTORIALS (6 total - 3 existing + 3 new)
// ============================================================================

// 11. Window Functions (EXISTING - keeping original)
const windowFunctionsTutorial = {
  slug: 'intro-to-window-functions',
  title: 'Introduction to Window Functions',
  description: 'Learn how to use window functions for advanced data analysis without collapsing rows like GROUP BY',
  difficulty_tier: 'advanced',
  topic: 'Window Functions',
  prerequisites: [],
  order_index: 11,
  estimated_time_minutes: 30,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'What are Window Functions?',
        order: 1,
        content: {
          text: `Window functions perform calculations across a set of rows related to the current row, without collapsing the result set like GROUP BY does. They allow you to calculate running totals, moving averages, and rankings while preserving all rows in the result set.`,
          keyPoints: [
            'Calculate running totals and moving averages',
            'Rank rows within partitions',
            'Access data from other rows without self-joins',
            'Preserve all rows in the result set (unlike GROUP BY)'
          ],
          useCases: [
            'Ranking products by sales within each category',
            'Calculating running totals of orders',
            'Comparing each row to the previous row',
            'Finding top N items per group'
          ]
        }
      },
      {
        type: 'example',
        title: 'Your First Window Function',
        order: 2,
        content: {
          description: 'Let\'s rank products by price within each category',
          query: `SELECT
  product_name,
  category,
  price,
  ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) as price_rank
FROM products
ORDER BY category, price_rank;`,
          explanation: 'This query assigns a rank to each product within its category based on price. ROW_NUMBER() gives each row a unique number, PARTITION BY creates separate "windows" for each category, and ORDER BY determines the ranking order.',
          annotations: [
            { line: 4, text: 'ROW_NUMBER() assigns a unique number to each row' },
            { line: 4, text: 'PARTITION BY creates separate "windows" for each category' },
            { line: 4, text: 'ORDER BY determines the ranking order within each partition' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Modify the query to experiment with window functions',
          starterQuery: `SELECT
  product_name,
  category,
  price,
  ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) as price_rank
FROM products;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Change ROW_NUMBER() to RANK() and observe the difference',
              hint: 'RANK() handles ties differently than ROW_NUMBER()'
            },
            {
              taskNumber: 2,
              instruction: 'Change the ORDER BY to sort by product_name instead of price',
              hint: 'The ORDER BY inside OVER() determines what you\'re ranking by'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'Window functions don\'t collapse rows like GROUP BY',
            'PARTITION BY divides data into groups',
            'ORDER BY within OVER() determines ranking order',
            'ROW_NUMBER() assigns unique ranks, RANK() allows ties'
          ],
          nextSteps: [
            'Try DENSE_RANK() for continuous ranking',
            'Explore LAG() and LEAD() for accessing other rows',
            'Learn about running totals with SUM() OVER()'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// 12. CTEs (EXISTING - keeping original)
const ctesTutorial = {
  slug: 'common-table-expressions',
  title: 'Common Table Expressions (CTEs)',
  description: 'Master the WITH clause to write cleaner, more readable SQL queries',
  difficulty_tier: 'advanced',
  topic: 'CTEs',
  prerequisites: [],
  order_index: 12,
  estimated_time_minutes: 25,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'What are CTEs?',
        order: 1,
        content: {
          text: `Common Table Expressions (CTEs) allow you to define temporary named result sets that exist only for the duration of a single query. They make complex queries more readable and can be referenced multiple times.`,
          keyPoints: [
            'Define temporary named result sets',
            'Improve query readability',
            'Can reference the same CTE multiple times',
            'Alternative to subqueries for better organization'
          ],
          useCases: [
            'Breaking down complex queries into logical steps',
            'Recursive queries (hierarchical data)',
            'Reusing the same subquery multiple times',
            'Making queries more maintainable'
          ]
        }
      },
      {
        type: 'example',
        title: 'Basic CTE Syntax',
        order: 2,
        content: {
          description: 'Using a CTE to find high-value customers',
          query: `WITH high_value_customers AS (
  SELECT customer_id, SUM(total_amount) as total_spent
  FROM orders
  GROUP BY customer_id
  HAVING SUM(total_amount) > 1000
)
SELECT
  c.first_name,
  c.last_name,
  hvc.total_spent
FROM customers c
JOIN high_value_customers hvc ON c.customer_id = hvc.customer_id
ORDER BY hvc.total_spent DESC;`,
          explanation: 'This query uses a CTE to first identify high-value customers, then joins that result with the customers table to get their names.',
          annotations: [
            { line: 1, text: 'WITH keyword starts the CTE definition' },
            { line: 2, text: 'CTE name followed by AS and the query definition' },
            { line: 8, text: 'Main query can reference the CTE like a regular table' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Experiment with CTEs by modifying the query',
          starterQuery: `WITH product_sales AS (
  SELECT
    p.product_id,
    p.product_name,
    SUM(oi.quantity * oi.unit_price) as total_sales
  FROM products p
  JOIN order_items oi ON p.product_id = oi.product_id
  GROUP BY p.product_id, p.product_name
)
SELECT * FROM product_sales ORDER BY total_sales DESC;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Add a WHERE clause to filter products with sales > 500',
              hint: 'You can add WHERE after the CTE definition in the main query'
            },
            {
              taskNumber: 2,
              instruction: 'Create a second CTE and join it with the first',
              hint: 'You can define multiple CTEs separated by commas'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'CTEs use the WITH keyword',
            'They improve query readability',
            'Multiple CTEs can be chained together',
            'CTEs are evaluated once and can be referenced multiple times'
          ],
          nextSteps: [
            'Learn about recursive CTEs for hierarchical data',
            'Compare CTEs vs subqueries for performance',
            'Practice refactoring subqueries into CTEs'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// 13. Subqueries (EXISTING - keeping original)
const subqueriesTutorial = {
  slug: 'subqueries-fundamentals',
  title: 'Subqueries Fundamentals',
  description: 'Master scalar, correlated, and EXISTS subqueries for powerful data filtering',
  difficulty_tier: 'advanced',
  topic: 'Subqueries',
  prerequisites: [],
  order_index: 13,
  estimated_time_minutes: 30,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'What are Subqueries?',
        order: 1,
        content: {
          text: `Subqueries are queries nested inside other queries. They allow you to use the result of one query as input for another, enabling powerful data filtering and calculations.`,
          keyPoints: [
            'Queries nested inside other queries',
            'Can return single values (scalar) or multiple rows',
            'Used in SELECT, FROM, WHERE, and HAVING clauses',
            'Correlated subqueries reference outer query columns'
          ],
          useCases: [
            'Finding records that match criteria from another table',
            'Calculating values based on related data',
            'Filtering with complex conditions',
            'Comparing values across tables'
          ]
        }
      },
      {
        type: 'example',
        title: 'Types of Subqueries',
        order: 2,
        content: {
          description: 'Examples of different subquery types',
          query: `-- Scalar subquery (returns single value)
SELECT
  product_name,
  price,
  (SELECT AVG(price) FROM products) as avg_price
FROM products;

-- IN subquery (returns multiple values)
SELECT * FROM customers
WHERE customer_id IN (
  SELECT DISTINCT customer_id FROM orders
  WHERE total_amount > 500
);

-- EXISTS subquery (checks for existence)
SELECT * FROM products p
WHERE EXISTS (
  SELECT 1 FROM order_items oi
  WHERE oi.product_id = p.product_id
);`,
          explanation: 'Scalar subqueries return a single value, IN subqueries check membership in a list, and EXISTS checks for the existence of related records.',
          annotations: [
            { line: 4, text: 'Scalar subquery returns a single average value' },
            { line: 8, text: 'IN subquery returns a list of customer IDs' },
            { line: 14, text: 'EXISTS checks if any related records exist' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice writing different types of subqueries',
          starterQuery: `SELECT
  c.first_name,
  c.last_name,
  (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id) as order_count
FROM customers c;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Modify to only show customers with more than 2 orders',
              hint: 'Add a WHERE clause with a subquery condition'
            },
            {
              taskNumber: 2,
              instruction: 'Use EXISTS instead of a scalar subquery',
              hint: 'EXISTS is often more efficient than scalar subqueries'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'Scalar subqueries return single values',
            'IN subqueries check membership in a list',
            'EXISTS checks for existence (often more efficient)',
            'Correlated subqueries reference outer query columns'
          ],
          nextSteps: [
            'Learn when to use subqueries vs JOINs',
            'Explore correlated subqueries in detail',
            'Practice optimizing subquery performance'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// 14. Self-Joins (NEW)
const selfJoinsTutorial = {
  slug: 'self-joins',
  title: 'Self-Joins',
  description: 'Learn to join a table to itself for hierarchical data and row-to-row comparisons',
  difficulty_tier: 'advanced',
  topic: 'Self-Joins',
  prerequisites: [],
  order_index: 14,
  estimated_time_minutes: 25,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'What are Self-Joins?',
        order: 1,
        content: {
          text: `A self-join joins a table to itself. This is useful for comparing rows within the same table, working with hierarchical data (like employee-manager relationships), or finding relationships between records in the same table.`,
          keyPoints: [
            'Join a table to itself',
            'Requires table aliases to distinguish copies',
            'Common for hierarchical relationships',
            'Useful for row-to-row comparisons'
          ],
          useCases: [
            'Employee-manager relationships',
            'Finding products in the same category',
            'Comparing sequential records (before/after)',
            'Detecting duplicates or similar records'
          ]
        }
      },
      {
        type: 'example',
        title: 'Self-Join Examples',
        order: 2,
        content: {
          description: 'Common self-join patterns',
          query: `-- Employee-manager relationship
SELECT
  e.employee_name as employee,
  m.employee_name as manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id;

-- Products in the same category
SELECT
  p1.product_name as product1,
  p2.product_name as product2,
  p1.category
FROM products p1
JOIN products p2 ON p1.category = p2.category
WHERE p1.product_id < p2.product_id  -- Avoid duplicates
ORDER BY p1.category, p1.product_name;

-- Comparing consecutive records
SELECT
  curr.order_id as current_order,
  prev.order_id as previous_order,
  curr.total_amount - prev.total_amount as amount_diff
FROM orders curr
JOIN orders prev ON curr.customer_id = prev.customer_id
WHERE curr.order_date > prev.order_date
ORDER BY curr.customer_id, curr.order_date;`,
          explanation: 'Use different aliases (e, m or p1, p2) to distinguish the two copies of the table. The join condition connects related rows. Add WHERE clauses to prevent duplicate pairs and filter results.',
          annotations: [
            { line: 5, text: 'Two aliases (e, m) for the same table' },
            { line: 6, text: 'Join connects employee to their manager' },
            { line: 14, text: 'p1.product_id < p2.product_id avoids duplicate pairs' },
            { line: 23, text: 'Compare current order to previous orders' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice self-joins',
          starterQuery: `SELECT
  e.first_name as employee,
  m.first_name as manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Add both first_name and last_name for employee and manager',
              hint: 'Add e.last_name and m.last_name to SELECT'
            },
            {
              taskNumber: 2,
              instruction: 'Add WHERE to show only employees with managers',
              hint: 'Add WHERE m.employee_id IS NOT NULL'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'Self-joins join a table to itself',
            'Requires different aliases for each copy',
            'Common for hierarchical data',
            'Use WHERE to avoid duplicate pairs'
          ],
          nextSteps: [
            'Practice with hierarchical data',
            'Explore recursive CTEs as an alternative',
            'Learn about graph traversal in SQL'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// 15. CASE Statements (NEW)
const caseStatementsTutorial = {
  slug: 'case-statements',
  title: 'Conditional Logic with CASE',
  description: 'Use CASE expressions to add conditional logic to your queries',
  difficulty_tier: 'advanced',
  topic: 'CASE Statements',
  prerequisites: [],
  order_index: 15,
  estimated_time_minutes: 25,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'What are CASE Statements?',
        order: 1,
        content: {
          text: `CASE expressions add if-then-else logic to SQL queries. They allow you to return different values based on conditions, categorize data, handle NULL values, and perform complex transformations inline.`,
          keyPoints: [
            'Add conditional logic to queries',
            'Two forms: simple CASE and searched CASE',
            'Return different values based on conditions',
            'Works in SELECT, WHERE, ORDER BY, and more'
          ],
          useCases: [
            'Categorizing numeric values into ranges',
            'Creating readable status labels',
            'Handling NULL or missing data',
            'Complex data transformations'
          ]
        }
      },
      {
        type: 'example',
        title: 'CASE Expression Patterns',
        order: 2,
        content: {
          description: 'Different ways to use CASE',
          query: `-- Simple CASE (equality checks)
SELECT
  product_name,
  CASE category
    WHEN 'Electronics' THEN 'Tech'
    WHEN 'Computers' THEN 'Tech'
    WHEN 'Clothing' THEN 'Apparel'
    ELSE 'Other'
  END as category_group
FROM products;

-- Searched CASE (complex conditions)
SELECT
  product_name,
  price,
  CASE
    WHEN price < 25 THEN 'Budget'
    WHEN price >= 25 AND price < 100 THEN 'Mid-range'
    WHEN price >= 100 THEN 'Premium'
    ELSE 'Unknown'
  END as price_tier
FROM products;

-- CASE in aggregations
SELECT
  category,
  COUNT(*) as total_products,
  SUM(CASE WHEN price < 50 THEN 1 ELSE 0 END) as budget_count,
  SUM(CASE WHEN price >= 50 THEN 1 ELSE 0 END) as premium_count,
  AVG(CASE WHEN in_stock = 1 THEN price END) as avg_price_in_stock
FROM products
GROUP BY category;

-- CASE for sorting
SELECT product_name, status
FROM products
ORDER BY
  CASE status
    WHEN 'in_stock' THEN 1
    WHEN 'low_stock' THEN 2
    WHEN 'out_of_stock' THEN 3
  END;`,
          explanation: 'Simple CASE checks equality against one expression. Searched CASE evaluates multiple conditions. CASE can be used with aggregates for conditional counting and averaging. Use CASE in ORDER BY for custom sort orders.',
          annotations: [
            { line: 4, text: 'Simple CASE checks category equality' },
            { line: 16, text: 'Searched CASE with complex conditions' },
            { line: 28, text: 'Conditional counting with CASE' },
            { line: 29, text: 'AVG only considers non-NULL values from CASE' },
            { line: 37, text: 'Custom sort order with CASE' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice using CASE expressions',
          starterQuery: `SELECT
  product_name,
  price,
  CASE
    WHEN price < 50 THEN 'Cheap'
    WHEN price >= 50 THEN 'Expensive'
  END as price_category
FROM products;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Add a third tier for prices over $100 called "Premium"',
              hint: 'Add another WHEN clause: WHEN price >= 100 THEN \'Premium\''
            },
            {
              taskNumber: 2,
              instruction: 'Add ELSE to handle NULL prices',
              hint: 'Add ELSE \'Unknown\' before END'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'CASE adds if-then-else logic to SQL',
            'Simple CASE for equality, searched CASE for complex conditions',
            'Use with SELECT, WHERE, ORDER BY, GROUP BY',
            'Powerful for categorization and transformation'
          ],
          nextSteps: [
            'Practice CASE with aggregations',
            'Use CASE for pivot table logic',
            'Learn about COALESCE and NULLIF as simpler alternatives'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// 16. Date/Time Functions (NEW)
const dateTimeTutorial = {
  slug: 'date-time-functions',
  title: 'Date and Time Functions',
  description: 'Master date/time manipulation for time-series analysis and temporal queries',
  difficulty_tier: 'advanced',
  topic: 'Date/Time Functions',
  prerequisites: [],
  order_index: 16,
  estimated_time_minutes: 30,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'Working with Dates and Times',
        order: 1,
        content: {
          text: `Date and time functions are essential for time-series analysis, reporting, and filtering data by date ranges. SQL provides powerful functions to extract date parts, perform date arithmetic, and format dates for display.`,
          keyPoints: [
            'Extract date parts (year, month, day)',
            'Perform date arithmetic (add/subtract)',
            'Format dates for display',
            'Filter by date ranges and intervals'
          ],
          useCases: [
            'Monthly or yearly sales reports',
            'Finding records within date ranges',
            'Calculating time differences',
            'Date-based aggregations and grouping'
          ]
        }
      },
      {
        type: 'example',
        title: 'Common Date/Time Operations',
        order: 2,
        content: {
          description: 'Essential date/time functions',
          query: `-- Extract date parts
SELECT
  order_date,
  strftime('%Y', order_date) as year,
  strftime('%m', order_date) as month,
  strftime('%d', order_date) as day,
  strftime('%w', order_date) as day_of_week
FROM orders;

-- Date arithmetic
SELECT
  order_date,
  DATE(order_date, '+7 days') as one_week_later,
  DATE(order_date, '-1 month') as one_month_ago,
  julianday(shipped_date) - julianday(order_date) as days_to_ship
FROM orders;

-- Date filtering
SELECT * FROM orders
WHERE order_date >= DATE('now', '-30 days')
  AND order_date < DATE('now');

-- Group by date periods
SELECT
  strftime('%Y-%m', order_date) as month,
  COUNT(*) as order_count,
  SUM(total_amount) as monthly_revenue
FROM orders
GROUP BY strftime('%Y-%m', order_date)
ORDER BY month;

-- Compare time periods
SELECT
  strftime('%Y-%m', order_date) as month,
  SUM(total_amount) as current_month,
  LAG(SUM(total_amount)) OVER (ORDER BY strftime('%Y-%m', order_date)) as prev_month
FROM orders
GROUP BY month;`,
          explanation: 'Use strftime() to extract or format date parts. DATE() performs date arithmetic. julianday() converts to numeric format for calculations. Group by formatted dates for time-series aggregations.',
          annotations: [
            { line: 4, text: 'strftime() extracts and formats date parts' },
            { line: 13, text: 'DATE() with interval adds/subtracts time' },
            { line: 15, text: 'julianday() for calculating differences' },
            { line: 20, text: 'DATE(\'now\', \'-30 days\') for relative dates' },
            { line: 25, text: 'Format as YYYY-MM for monthly grouping' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice date/time operations',
          starterQuery: `SELECT
  order_date,
  strftime('%Y', order_date) as year,
  total_amount
FROM orders
WHERE order_date >= '2024-01-01';`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Add month extraction and group by year and month',
              hint: 'Add strftime(\'%m\', order_date) and use GROUP BY with SUM()'
            },
            {
              taskNumber: 2,
              instruction: 'Change WHERE to find orders from the last 90 days',
              hint: 'Use WHERE order_date >= DATE(\'now\', \'-90 days\')'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'strftime() extracts and formats date parts',
            'DATE() performs date arithmetic',
            'Use julianday() for date difference calculations',
            'Group by formatted dates for time-series analysis'
          ],
          nextSteps: [
            'Learn database-specific date functions',
            'Practice time zone handling',
            'Explore more strftime() format codes'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// ============================================================================
// EXPERT TUTORIALS (3)
// ============================================================================

// 17. Recursive CTEs (NEW)
const recursiveCTEsTutorial = {
  slug: 'recursive-ctes',
  title: 'Recursive CTEs',
  description: 'Master recursive Common Table Expressions for hierarchical and graph data',
  difficulty_tier: 'expert',
  topic: 'Recursive CTEs',
  prerequisites: [],
  order_index: 17,
  estimated_time_minutes: 40,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'What are Recursive CTEs?',
        order: 1,
        content: {
          text: `Recursive CTEs allow a query to reference itself, enabling traversal of hierarchical or graph-structured data. They consist of an anchor member (base case) and a recursive member that references the CTE itself.`,
          keyPoints: [
            'Query references itself for iteration',
            'Requires anchor member (base case) and recursive member',
            'Ideal for hierarchical data (org charts, categories)',
            'Can traverse graphs and trees'
          ],
          useCases: [
            'Organization hierarchies (employee reporting chains)',
            'Category/subcategory trees',
            'Bill of materials (parts and subparts)',
            'Finding all paths in a graph'
          ]
        }
      },
      {
        type: 'example',
        title: 'Recursive CTE Examples',
        order: 2,
        content: {
          description: 'Traversing hierarchical data',
          query: `-- Employee hierarchy (org chart)
WITH RECURSIVE org_chart AS (
  -- Anchor: Start with CEO (no manager)
  SELECT
    employee_id,
    employee_name,
    manager_id,
    1 as level,
    employee_name as path
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- Recursive: Get each employee's direct reports
  SELECT
    e.employee_id,
    e.employee_name,
    e.manager_id,
    oc.level + 1,
    oc.path || ' > ' || e.employee_name
  FROM employees e
  JOIN org_chart oc ON e.manager_id = oc.employee_id
)
SELECT * FROM org_chart
ORDER BY level, employee_name;

-- Category tree (nested categories)
WITH RECURSIVE category_tree AS (
  -- Anchor: Top-level categories
  SELECT
    category_id,
    category_name,
    parent_category_id,
    1 as depth,
    category_name as path
  FROM categories
  WHERE parent_category_id IS NULL

  UNION ALL

  -- Recursive: Get subcategories
  SELECT
    c.category_id,
    c.category_name,
    c.parent_category_id,
    ct.depth + 1,
    ct.path || ' > ' || c.category_name
  FROM categories c
  JOIN category_tree ct ON c.parent_category_id = ct.category_id
)
SELECT
  SUBSTR('    ', 1, (depth - 1) * 2) || category_name as indented_name,
  depth,
  path
FROM category_tree
ORDER BY path;`,
          explanation: 'Recursive CTEs have two parts united by UNION ALL: (1) Anchor member defines the starting point, (2) Recursive member references the CTE itself to process the next level. The recursion stops when no more rows are returned.',
          annotations: [
            { line: 2, text: 'RECURSIVE keyword enables self-reference' },
            { line: 4, text: 'Anchor member: starting point (base case)' },
            { line: 13, text: 'UNION ALL combines anchor and recursive parts' },
            { line: 16, text: 'Recursive member: references org_chart itself' },
            { line: 22, text: 'JOIN to the CTE itself creates recursion' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice recursive CTEs',
          starterQuery: `WITH RECURSIVE number_sequence AS (
  SELECT 1 as n
  UNION ALL
  SELECT n + 1 FROM number_sequence WHERE n < 10
)
SELECT * FROM number_sequence;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Change to generate numbers 1 through 20',
              hint: 'Modify WHERE n < 10 to WHERE n < 20'
            },
            {
              taskNumber: 2,
              instruction: 'Add a column that shows the square of each number',
              hint: 'Add n * n as square to the SELECT in the final query'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'Recursive CTEs reference themselves',
            'Require anchor (base) and recursive members',
            'United with UNION ALL',
            'Perfect for hierarchical and graph data',
            'Recursion stops when no rows are returned'
          ],
          nextSteps: [
            'Practice with real organizational data',
            'Learn about cycle detection in graphs',
            'Explore performance considerations'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// 18. Advanced Analytics (NEW)
const advancedAnalyticsTutorial = {
  slug: 'advanced-analytics',
  title: 'Advanced Analytics Functions',
  description: 'Master LAG, LEAD, NTILE, PERCENT_RANK and other advanced analytical functions',
  difficulty_tier: 'expert',
  topic: 'Advanced Analytics',
  prerequisites: [],
  order_index: 18,
  estimated_time_minutes: 35,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'Advanced Window Functions',
        order: 1,
        content: {
          text: `Advanced analytics functions extend window functions with capabilities like accessing other rows (LAG/LEAD), distributing data into buckets (NTILE), calculating percentiles (PERCENT_RANK), and cumulative distributions. These are essential for complex data analysis.`,
          keyPoints: [
            'Access previous/next rows with LAG and LEAD',
            'Distribute data into buckets with NTILE',
            'Calculate percentile ranks',
            'Compute cumulative distributions'
          ],
          useCases: [
            'Period-over-period comparisons (MoM, YoY)',
            'Quartile and percentile analysis',
            'Moving averages and trends',
            'Customer cohort analysis'
          ]
        }
      },
      {
        type: 'example',
        title: 'Advanced Analytics in Action',
        order: 2,
        content: {
          description: 'Powerful analytical queries',
          query: `-- LAG and LEAD for comparisons
SELECT
  order_date,
  total_amount,
  LAG(total_amount) OVER (ORDER BY order_date) as prev_order,
  total_amount - LAG(total_amount) OVER (ORDER BY order_date) as change,
  LEAD(total_amount) OVER (ORDER BY order_date) as next_order
FROM orders
ORDER BY order_date;

-- NTILE for quartiles/deciles
SELECT
  customer_id,
  total_spent,
  NTILE(4) OVER (ORDER BY total_spent DESC) as quartile,
  NTILE(10) OVER (ORDER BY total_spent DESC) as decile
FROM (
  SELECT customer_id, SUM(total_amount) as total_spent
  FROM orders
  GROUP BY customer_id
);

-- PERCENT_RANK for percentile
SELECT
  product_name,
  price,
  PERCENT_RANK() OVER (ORDER BY price) as price_percentile,
  ROUND(PERCENT_RANK() OVER (ORDER BY price) * 100, 1) as percentile_display
FROM products;

-- Moving average
SELECT
  order_date,
  total_amount,
  AVG(total_amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) as moving_avg_3day,
  SUM(total_amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total
FROM orders;`,
          explanation: 'LAG and LEAD access rows before/after the current row. NTILE distributes rows into N equal buckets. PERCENT_RANK calculates relative position (0 to 1). ROWS BETWEEN defines frame for moving calculations.',
          annotations: [
            { line: 5, text: 'LAG accesses previous row value' },
            { line: 7, text: 'LEAD accesses next row value' },
            { line: 14, text: 'NTILE(4) divides into quartiles' },
            { line: 15, text: 'NTILE(10) divides into deciles' },
            { line: 26, text: 'PERCENT_RANK returns 0 to 1' },
            { line: 35, text: 'ROWS BETWEEN defines calculation window' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice advanced analytics',
          starterQuery: `SELECT
  product_name,
  price,
  LAG(price) OVER (ORDER BY price) as prev_price
FROM products
ORDER BY price;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Add a column showing price difference from previous product',
              hint: 'Add: price - LAG(price) OVER (ORDER BY price) as price_diff'
            },
            {
              taskNumber: 2,
              instruction: 'Add NTILE to divide products into 5 price tiers',
              hint: 'Add: NTILE(5) OVER (ORDER BY price) as price_tier'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'LAG/LEAD access previous/next rows',
            'NTILE distributes into equal buckets',
            'PERCENT_RANK calculates percentile position',
            'ROWS BETWEEN defines calculation windows',
            'Essential for time-series and cohort analysis'
          ],
          nextSteps: [
            'Explore FIRST_VALUE and LAST_VALUE',
            'Practice with real time-series data',
            'Learn about frame clauses (RANGE vs ROWS)'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// 19. Query Optimization (NEW)
const queryOptimizationTutorial = {
  slug: 'query-optimization',
  title: 'Query Optimization Techniques',
  description: 'Learn to write efficient SQL queries and understand query performance',
  difficulty_tier: 'expert',
  topic: 'Query Optimization',
  prerequisites: [],
  order_index: 19,
  estimated_time_minutes: 45,
  content: {
    sections: [
      {
        type: 'introduction',
        title: 'Why Query Optimization Matters',
        order: 1,
        content: {
          text: `Query optimization ensures your SQL runs efficiently as data grows. Understanding indexes, execution plans, and common performance patterns helps you write queries that scale. Small changes can dramatically improve performance.`,
          keyPoints: [
            'Indexes dramatically speed up queries',
            'Execution plans show query performance',
            'Avoid common anti-patterns',
            'Consider query complexity and data volume'
          ],
          useCases: [
            'Improving slow dashboard queries',
            'Optimizing reports on large tables',
            'Reducing database load',
            'Scaling applications effectively'
          ]
        }
      },
      {
        type: 'example',
        title: 'Optimization Techniques',
        order: 2,
        content: {
          description: 'Common optimization patterns',
          query: `-- EXPLAIN to see query plan
EXPLAIN QUERY PLAN
SELECT * FROM orders
WHERE customer_id = 123;

-- Use indexes effectively (indexed columns in WHERE)
-- GOOD: Uses index
SELECT * FROM orders WHERE customer_id = 123;

-- BAD: Function on column prevents index use
SELECT * FROM orders WHERE UPPER(email) = 'USER@EMAIL.COM';
-- BETTER: Store normalized data or use functional index

-- Use EXISTS instead of IN for large subqueries
-- GOOD: EXISTS stops at first match
SELECT * FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.customer_id = c.customer_id
);

-- SLOWER: IN builds entire list
SELECT * FROM customers c
WHERE c.customer_id IN (
  SELECT customer_id FROM orders
);

-- Avoid SELECT * - request only needed columns
-- BAD
SELECT * FROM orders;  -- Gets all columns

-- GOOD
SELECT order_id, customer_id, total_amount FROM orders;

-- Use JOINs instead of subqueries when possible
-- SLOWER: Correlated subquery runs for each row
SELECT
  c.customer_id,
  (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id) as order_count
FROM customers c;

-- FASTER: JOIN runs once
SELECT
  c.customer_id,
  COUNT(o.order_id) as order_count
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id;

-- Limit results when appropriate
SELECT * FROM products
ORDER BY created_at DESC
LIMIT 20;  -- Only get what you need

-- Consider covering indexes for common queries
-- If you frequently query: WHERE category = ? ORDER BY price
-- Create index: CREATE INDEX idx_category_price ON products(category, price);`,
          explanation: 'Use EXPLAIN to understand query execution. Index columns used in WHERE, JOIN, and ORDER BY. Avoid functions on indexed columns. EXISTS is faster than IN for large datasets. Request only needed columns. JOINs often outperform correlated subqueries.',
          annotations: [
            { line: 2, text: 'EXPLAIN shows how the database executes query' },
            { line: 10, text: 'Functions on columns prevent index usage' },
            { line: 16, text: 'EXISTS stops at first match' },
            { line: 31, text: 'Only request columns you need' },
            { line: 37, text: 'Correlated subquery runs many times' },
            { line: 42, text: 'JOIN approach is typically faster' },
            { line: 50, text: 'LIMIT reduces result set size' }
          ]
        }
      },
      {
        type: 'interactive',
        title: 'Try It Yourself',
        order: 3,
        content: {
          instructions: 'Practice query optimization',
          starterQuery: `SELECT *
FROM orders o
WHERE o.customer_id IN (
  SELECT customer_id FROM customers WHERE city = 'New York'
)
ORDER BY o.order_date DESC;`,
          tasks: [
            {
              taskNumber: 1,
              instruction: 'Rewrite using JOIN instead of IN subquery',
              hint: 'Replace IN with JOIN: FROM orders o JOIN customers c ON ...'
            },
            {
              taskNumber: 2,
              instruction: 'Replace SELECT * with specific columns',
              hint: 'List only the columns you need instead of *'
            }
          ]
        }
      },
      {
        type: 'summary',
        title: 'Key Takeaways',
        order: 4,
        content: {
          keyTakeaways: [
            'Use EXPLAIN to understand query execution',
            'Index columns used in WHERE, JOIN, ORDER BY',
            'Avoid functions on indexed columns',
            'EXISTS often faster than IN',
            'Request only needed columns (avoid SELECT *)',
            'JOINs typically outperform correlated subqueries'
          ],
          nextSteps: [
            'Learn about different index types',
            'Practice reading execution plans',
            'Explore database-specific optimization features',
            'Study query cost analysis'
          ],
          relatedTutorials: []
        }
      }
    ],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
};

// ============================================================================
// SEED FUNCTION
// ============================================================================

async function seedTutorials() {
  try {
    console.log('Connecting to Supabase...');
    console.log(`URL: ${supabaseUrl}`);

    // All tutorials in order
    const tutorials = [
      // Basic (1-5)
      selectFundamentalsTutorial,
      whereClauseTutorial,
      orderByTutorial,
      distinctTutorial,
      nullHandlingTutorial,
      // Intermediate (6-10)
      joinsTutorial,
      aggregatesTutorial,
      groupByTutorial,
      havingTutorial,
      multipleTablesTutorial,
      // Advanced (11-16)
      windowFunctionsTutorial,
      ctesTutorial,
      subqueriesTutorial,
      selfJoinsTutorial,
      caseStatementsTutorial,
      dateTimeTutorial,
      // Expert (17-19)
      recursiveCTEsTutorial,
      advancedAnalyticsTutorial,
      queryOptimizationTutorial
    ];

    console.log(`\nSeeding ${tutorials.length} tutorials...\n`);

    for (const tutorial of tutorials) {
      // Prepare the tutorial data for Supabase
      const tutorialData = {
        slug: tutorial.slug,
        title: tutorial.title,
        description: tutorial.description,
        difficulty_tier: tutorial.difficulty_tier,
        topic: tutorial.topic,
        prerequisites: tutorial.prerequisites || [],
        order_index: tutorial.order_index,
        content: tutorial.content, // Supabase handles JSONB automatically
        estimated_time_minutes: tutorial.estimated_time_minutes
      };

      // Use upsert to handle duplicates (ON CONFLICT)
      const { data, error } = await supabase
        .from('tutorials')
        .upsert(tutorialData, {
          onConflict: 'slug',
          ignoreDuplicates: false
        })
        .select('id')
        .single();

      if (error) {
        console.error(`✗ Error seeding ${tutorial.slug}:`, error.message);
        throw error;
      }

      console.log(`✓ Seeded: [${tutorial.difficulty_tier.toUpperCase().padEnd(12)}] ${tutorial.title} (ID: ${data.id})`);
    }

    console.log('\n✅ Successfully seeded all tutorials!');
    console.log(`\nSummary:`);
    console.log(`  Basic: 5 tutorials`);
    console.log(`  Intermediate: 5 tutorials`);
    console.log(`  Advanced: 6 tutorials`);
    console.log(`  Expert: 3 tutorials`);
    console.log(`  Total: ${tutorials.length} tutorials`);
  } catch (error) {
    console.error('Error seeding tutorials:', error);
    process.exit(1);
  }
}

seedTutorials();
