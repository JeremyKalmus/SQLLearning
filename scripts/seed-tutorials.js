/**
 * Seed script for Tutorials Feature
 * Creates initial tutorials: Window Functions, CTEs, and Subqueries
 * 
 * Usage: node scripts/seed-tutorials.js
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
});

// Window Functions Tutorial
const windowFunctionsTutorial = {
  slug: 'intro-to-window-functions',
  title: 'Introduction to Window Functions',
  description: 'Learn how to use window functions for advanced data analysis without collapsing rows like GROUP BY',
  difficulty_tier: 'advanced',
  topic: 'Window Functions',
  prerequisites: [],
  order_index: 1,
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

// CTEs Tutorial
const ctesTutorial = {
  slug: 'common-table-expressions',
  title: 'Common Table Expressions (CTEs)',
  description: 'Master the WITH clause to write cleaner, more readable SQL queries',
  difficulty_tier: 'advanced',
  topic: 'CTEs',
  prerequisites: [],
  order_index: 2,
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

// Subqueries Tutorial
const subqueriesTutorial = {
  slug: 'subqueries-fundamentals',
  title: 'Subqueries Fundamentals',
  description: 'Master scalar, correlated, and EXISTS subqueries for powerful data filtering',
  difficulty_tier: 'advanced',
  topic: 'Subqueries',
  prerequisites: [],
  order_index: 3,
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

async function seedTutorials() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Insert tutorials
    const tutorials = [windowFunctionsTutorial, ctesTutorial, subqueriesTutorial];

    for (const tutorial of tutorials) {
      const { rows } = await client.query(
        `INSERT INTO tutorials (
          slug, title, description, difficulty_tier, topic, 
          prerequisites, order_index, content, estimated_time_minutes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          difficulty_tier = EXCLUDED.difficulty_tier,
          topic = EXCLUDED.topic,
          prerequisites = EXCLUDED.prerequisites,
          order_index = EXCLUDED.order_index,
          content = EXCLUDED.content,
          estimated_time_minutes = EXCLUDED.estimated_time_minutes,
          updated_at = NOW()
        RETURNING id`,
        [
          tutorial.slug,
          tutorial.title,
          tutorial.description,
          tutorial.difficulty_tier,
          tutorial.topic,
          tutorial.prerequisites,
          tutorial.order_index,
          JSON.stringify(tutorial.content),
          tutorial.estimated_time_minutes
        ]
      );

      console.log(`✓ Seeded tutorial: ${tutorial.title} (ID: ${rows[0].id})`);

      // Note: Micro-challenges would be seeded separately
      // For now, tutorials are created without challenges
    }

    console.log('\n✅ Successfully seeded all tutorials!');
  } catch (error) {
    console.error('Error seeding tutorials:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedTutorials();

