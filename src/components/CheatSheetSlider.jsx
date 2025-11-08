import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function CheatSheetSlider({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when slider is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const cheatSheetSections = [
    {
      title: 'Query Order of Execution vs. Writing Order',
      content: (
        <>
          <h4>How SQL is WRITTEN:</h4>
          <pre>{`SELECT columns
FROM table
JOIN other_table ON condition
WHERE filter_conditions
GROUP BY columns
HAVING aggregate_filter
ORDER BY columns
LIMIT number;`}</pre>

          <h4>How SQL is EXECUTED (actual order):</h4>
          <ol>
            <li><strong>FROM</strong> - Get the base table(s)</li>
            <li><strong>JOIN</strong> - Combine tables</li>
            <li><strong>WHERE</strong> - Filter rows (before grouping)</li>
            <li><strong>GROUP BY</strong> - Group rows together</li>
            <li><strong>HAVING</strong> - Filter groups (after grouping)</li>
            <li><strong>SELECT</strong> - Choose/calculate columns</li>
            <li><strong>DISTINCT</strong> - Remove duplicates</li>
            <li><strong>ORDER BY</strong> - Sort results</li>
            <li><strong>LIMIT/OFFSET</strong> - Limit number of rows</li>
          </ol>
          <p className="tip">💡 <strong>Key Insight:</strong> You can&apos;t use a SELECT alias in WHERE, but you CAN use it in ORDER BY!</p>
        </>
      )
    },
    {
      title: 'Basic Query Structure',
      content: (
        <>
          <h4>Simple SELECT</h4>
          <pre>{`SELECT column1, column2, column3
FROM table_name;`}</pre>

          <h4>SELECT with Alias</h4>
          <pre>{`SELECT
    column1 AS alias1,
    column2 AS "Alias With Spaces"
FROM table_name AS t;`}</pre>

          <h4>SELECT DISTINCT (remove duplicates)</h4>
          <pre>{`SELECT DISTINCT column1, column2
FROM table_name;`}</pre>
        </>
      )
    },
    {
      title: 'Filtering Data (WHERE Clause)',
      content: (
        <>
          <h4>Basic Comparisons</h4>
          <pre>{`WHERE column = 'value'           -- Equal
WHERE column != 'value'          -- Not equal (also: <>)
WHERE column > 100               -- Greater than
WHERE column >= 100              -- Greater than or equal
WHERE column < 100               -- Less than
WHERE column <= 100              -- Less than or equal
WHERE column BETWEEN 10 AND 20   -- Between values (inclusive)
WHERE column IN ('A', 'B', 'C')  -- In a list
WHERE column NOT IN (1, 2, 3)    -- Not in a list`}</pre>

          <h4>Pattern Matching</h4>
          <pre>{`WHERE column LIKE 'Dog%'         -- Starts with "Dog"
WHERE column LIKE '%Food'        -- Ends with "Food"
WHERE column LIKE '%Cat%'        -- Contains "Cat"
WHERE column LIKE 'D_g'          -- Single character wildcard (_)
WHERE column NOT LIKE '%test%'   -- Doesn't contain "test"`}</pre>

          <h4>NULL Handling</h4>
          <pre>{`WHERE column IS NULL             -- Is NULL
WHERE column IS NOT NULL         -- Is not NULL`}</pre>

          <h4>Multiple Conditions</h4>
          <pre>{`WHERE condition1 AND condition2              -- Both must be true
WHERE condition1 OR condition2               -- At least one must be true
WHERE (condition1 OR condition2) AND condition3  -- Use parentheses for logic
WHERE NOT condition1                         -- Negation`}</pre>
        </>
      )
    },
    {
      title: 'Joining Tables',
      content: (
        <>
          <h4>INNER JOIN (only matching rows)</h4>
          <pre>{`SELECT *
FROM table1 t1
INNER JOIN table2 t2 ON t1.key = t2.key;`}</pre>

          <h4>LEFT JOIN (all from left table, matching from right)</h4>
          <pre>{`SELECT *
FROM table1 t1
LEFT JOIN table2 t2 ON t1.key = t2.key;`}</pre>

          <h4>Multiple Joins</h4>
          <pre>{`SELECT *
FROM sales s
JOIN date_table d ON s.date_id = d.date_id
JOIN product p ON s.product_id = p.product_id
JOIN customer c ON s.customer_id = c.customer_id;`}</pre>

          <h4>Self Join (joining table to itself)</h4>
          <pre>{`SELECT
    e1.employee_name,
    e2.employee_name AS manager_name
FROM employees e1
LEFT JOIN employees e2 ON e1.manager_id = e2.employee_id;`}</pre>
        </>
      )
    },
    {
      title: 'Aggregate Functions',
      content: (
        <>
          <h4>Basic Aggregates</h4>
          <pre>{`COUNT(*)                    -- Count all rows
COUNT(column)               -- Count non-NULL values
COUNT(DISTINCT column)      -- Count unique values
SUM(column)                 -- Sum of values
AVG(column)                 -- Average of values
MIN(column)                 -- Minimum value
MAX(column)                 -- Maximum value`}</pre>

          <h4>GROUP BY (group rows for aggregation)</h4>
          <pre>{`SELECT
    category,
    COUNT(*) AS count,
    SUM(sales) AS total_sales,
    AVG(sales) AS avg_sales
FROM sales
GROUP BY category;`}</pre>

          <h4>HAVING (filter groups)</h4>
          <pre>{`SELECT
    category,
    SUM(sales) AS total_sales
FROM sales
GROUP BY category
HAVING SUM(sales) > 1000;  -- Filter groups, not rows`}</pre>

          <p className="tip">💡 <strong>Remember:</strong> WHERE filters rows BEFORE grouping, HAVING filters groups AFTER grouping.</p>
        </>
      )
    },
    {
      title: 'Window Functions',
      content: (
        <>
          <h4>Basic Syntax</h4>
          <pre>{`FUNCTION() OVER (
    PARTITION BY column1    -- Optional: reset for each group
    ORDER BY column2        -- Optional: define row order
    ROWS/RANGE clause       -- Optional: define window frame
)`}</pre>

          <h4>Aggregate Window Functions</h4>
          <pre>{`-- Running total
SUM(sales) OVER (ORDER BY date)

-- Running total by category
SUM(sales) OVER (PARTITION BY category ORDER BY date)

-- Running average
AVG(sales) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)`}</pre>

          <h4>Ranking Functions</h4>
          <pre>{`ROW_NUMBER() OVER (ORDER BY sales DESC)        -- 1, 2, 3, 4 (unique)
RANK() OVER (ORDER BY sales DESC)              -- 1, 2, 2, 4 (gaps after ties)
DENSE_RANK() OVER (ORDER BY sales DESC)        -- 1, 2, 2, 3 (no gaps)
NTILE(4) OVER (ORDER BY sales DESC)            -- Divide into 4 groups`}</pre>
        </>
      )
    },
    {
      title: 'Date Functions',
      content: (
        <>
          <h4>Current Date/Time</h4>
          <pre>{`CURRENT_DATE                -- Today's date
CURRENT_TIME                -- Current time
CURRENT_TIMESTAMP           -- Current date and time
NOW()                       -- Current date and time`}</pre>

          <h4>Date Arithmetic</h4>
          <pre>{`DATE_ADD(date, INTERVAL 90 DAY)          -- Add 90 days
DATE_SUB(date, INTERVAL 1 MONTH)         -- Subtract 1 month
DATEADD(DAY, 90, date)                   -- Add 90 days (SQL Server)
DATEADD(MONTH, -1, date)                 -- Subtract 1 month (SQL Server)`}</pre>

          <h4>Extract Date Parts</h4>
          <pre>{`YEAR(date)                               -- Extract year
MONTH(date)                              -- Extract month (1-12)
DAY(date)                                -- Extract day (1-31)
QUARTER(date)                            -- Extract quarter (1-4)
EXTRACT(YEAR FROM date)                  -- Alternative syntax`}</pre>
        </>
      )
    },
    {
      title: 'String Functions',
      content: (
        <>
          <h4>Case Conversion</h4>
          <pre>{`UPPER(column)                -- Convert to uppercase
LOWER(column)                -- Convert to lowercase`}</pre>

          <h4>Substring Operations</h4>
          <pre>{`SUBSTRING(column, start, length)         -- Extract substring
LEFT(column, 5)                          -- First 5 characters
RIGHT(column, 5)                         -- Last 5 characters`}</pre>

          <h4>String Modification</h4>
          <pre>{`CONCAT(string1, string2)                 -- Concatenate strings
TRIM(column)                             -- Remove leading/trailing spaces
REPLACE(column, 'old', 'new')            -- Replace text
LENGTH(column)                           -- Length of string`}</pre>
        </>
      )
    },
    {
      title: 'Conditional Logic',
      content: (
        <>
          <h4>CASE Statements</h4>
          <pre>{`-- Simple CASE
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
END AS sales_category`}</pre>

          <h4>COALESCE (return first non-NULL value)</h4>
          <pre>{`COALESCE(column1, column2, 'default')    -- Returns first non-NULL`}</pre>
        </>
      )
    },
    {
      title: 'Common Table Expressions (CTEs)',
      content: (
        <>
          <h4>Single CTE</h4>
          <pre>{`WITH cte_name AS (
    SELECT column1, column2
    FROM table
    WHERE condition
)
SELECT *
FROM cte_name;`}</pre>

          <h4>Multiple CTEs</h4>
          <pre>{`WITH
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
FROM second_cte;`}</pre>
        </>
      )
    },
    {
      title: 'Performance Tips',
      content: (
        <>
          <ul>
            <li>Use indexes on JOIN and WHERE columns for faster queries</li>
            <li>Filter early - use WHERE before GROUP BY</li>
            <li>Limit columns - SELECT only what you need</li>
            <li>Use EXPLAIN to analyze query execution plan</li>
            <li>Avoid SELECT * in production code</li>
            <li>Use EXISTS instead of IN for subqueries when checking existence</li>
            <li>Use UNION ALL instead of UNION when duplicates don&apos;t matter</li>
            <li>Avoid functions in WHERE clause on indexed columns (breaks index)</li>
          </ul>
        </>
      )
    }
  ];

  const filteredSections = searchTerm
    ? cheatSheetSections.filter(section =>
        section.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : cheatSheetSections;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="cheatsheet-backdrop" onClick={onClose} />
      )}

      {/* Slider */}
      <div className={`cheatsheet-slider ${isOpen ? 'open' : ''}`}>
        <div className="cheatsheet-header">
          <h2>SQL Cheat Sheet</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="cheatsheet-search">
          <input
            type="text"
            placeholder="Search topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="cheatsheet-content">
          {filteredSections.length > 0 ? (
            filteredSections.map((section, index) => (
              <div key={index} className="cheatsheet-section">
                <h3>{section.title}</h3>
                <div className="section-content">
                  {section.content}
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No sections found matching &quot;{searchTerm}&quot;</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .cheatsheet-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 998;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .cheatsheet-slider {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 600px;
          max-width: 90vw;
          background: var(--surface, #ffffff);
          box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
          z-index: 999;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.3s ease-out;
        }

        .cheatsheet-slider.open {
          transform: translateX(0);
        }

        .cheatsheet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 2px solid var(--border, #e2e8f0);
          background: var(--primary, #2563eb);
          color: white;
        }

        .cheatsheet-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 1.5rem;
          width: 36px;
          height: 36px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .cheatsheet-search {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border, #e2e8f0);
          background: var(--background, #f8fafc);
        }

        .search-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 6px;
          font-size: 0.95rem;
          background: white;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary, #2563eb);
        }

        .cheatsheet-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .cheatsheet-section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--border, #e2e8f0);
        }

        .cheatsheet-section:last-child {
          border-bottom: none;
        }

        .cheatsheet-section h3 {
          color: var(--primary, #2563eb);
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .section-content h4 {
          color: var(--text, #1e293b);
          margin: 1rem 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .section-content :global(pre) {
          background: var(--background, #f8fafc);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 6px;
          padding: 1rem;
          overflow-x: auto;
          font-size: 0.875rem;
          line-height: 1.5;
          margin: 0.75rem 0;
          font-family: 'Courier New', Courier, monospace;
        }

        .section-content :global(ol),
        .section-content :global(ul) {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }

        .section-content :global(li) {
          margin: 0.5rem 0;
          line-height: 1.6;
        }

        .section-content :global(p.tip) {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 0.75rem 1rem;
          margin: 1rem 0;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .no-results {
          text-align: center;
          padding: 3rem;
          color: var(--text-secondary, #64748b);
        }

        .no-results p {
          margin: 0;
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .cheatsheet-slider {
            width: 100vw;
            max-width: 100vw;
          }

          .cheatsheet-header h2 {
            font-size: 1.25rem;
          }

          .cheatsheet-content {
            padding: 1rem;
          }

          .section-content :global(pre) {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </>
  );
}

CheatSheetSlider.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
