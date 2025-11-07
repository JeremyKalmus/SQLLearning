# Feature Overview

## Home Page

The landing page shows:
- **Welcome Message**: Introduction to the game
- **Two Mode Cards**:
  - Flashcard Mode (with 📚 icon)
  - Problem-Solving Mode (with 💻 icon)
- **Progress Dashboard**: Your stats at a glance
  - Problems Solved
  - Flashcards Reviewed
  - Total XP
- **Recent Activity**: Last 5 problems you solved
- **Header Stats Bar**: Level, XP, and Streak visible on every page

## Flashcard Mode Features

### Interface Elements
1. **Difficulty Selector**: 4 buttons (Basic | Intermediate | Advanced | Expert)
2. **Card Counter**: "Card 1 of 8" - tracks progress
3. **Interactive Flashcard**:
   - Front: Shows question and topic
   - Back: Shows answer, explanation, and code example
4. **Navigation**: Previous/Next buttons (or use arrow keys)
5. **Self-Assessment**: "❌ Need More Practice" or "✓ Got It!" buttons

### Flashcard Content Example

**Topic**: Window Functions
**Question**: What's the difference between ROW_NUMBER(), RANK(), and DENSE_RANK()?

**Answer**:
- ROW_NUMBER: 1,2,3,4 (unique)
- RANK: 1,2,2,4 (gaps after ties)
- DENSE_RANK: 1,2,2,3 (no gaps)

**Example**:
```sql
ROW_NUMBER() OVER (ORDER BY sales DESC) -- 1,2,3,4
RANK() OVER (ORDER BY sales DESC)       -- 1,2,2,4
DENSE_RANK() OVER (ORDER BY sales DESC) -- 1,2,2,3
```

### Keyboard Shortcuts
- **→ (Right Arrow)**: Next card
- **← (Left Arrow)**: Previous card
- **Spacebar**: Flip card

## Problem-Solving Mode Features

### Problem Workspace

1. **Problem Description Panel**
   - Problem title
   - Difficulty badge (color-coded)
   - Detailed problem description
   - Topic indicator

2. **Database Schema Panel**
   - Toggle to show/hide
   - Lists all tables with columns and types
   - Shows primary keys and foreign keys

3. **SQL Query Editor**
   - Large text area for writing queries
   - Syntax highlighting (monospace font)
   - 200px minimum height, resizable

4. **Action Buttons**
   - ▶ Run Query (primary blue button)
   - 💡 Get Hint (shows hints used: 0/3)
   - Clear (reset the editor)

5. **Results Panel** (appears after running query)
   - Professional table display
   - Shows first 10 rows
   - Indicates total row count if more than 10
   - Error messages in red if query fails

6. **Feedback Panel** (appears after checking)
   - Score out of 100
   - Correctness indicator (green for correct, yellow for needs work)
   - AI-generated feedback message
   - What you did well (praise)
   - Suggestions for improvement
   - Buttons to view solution or try next problem

7. **Solution Panel** (optional, can be shown)
   - Optimal SQL query
   - Explanation of the approach

### Example Problem Flow

**Generated Problem**:
```
Title: "Find Top Selling Products"
Difficulty: Intermediate
Topic: JOINs and GROUP BY

Description:
Find the top 3 products by total sales amount. Include the product name,
category, and total sales amount. Sort by sales amount in descending order.
```

**Sample Solution**:
```sql
SELECT
    p.product_name,
    p.category,
    SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) AS total_sales
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY p.product_id, p.product_name, p.category
ORDER BY total_sales DESC
LIMIT 3;
```

**AI Feedback Example**:
```
Score: 95/100

✓ Excellent work! Your query correctly identifies the top-selling products.

What you did well:
- Proper use of JOINs to connect products and order items
- Correct GROUP BY clause
- Applied discount calculation in the total

Suggestions:
- Consider adding column aliases for better readability
- The ORDER BY could explicitly reference the alias 'total_sales'
```

## Progress Tracking Features

### Tracked Metrics
1. **Total Problems Attempted**: All problems you've tried
2. **Total Problems Solved**: Successfully completed problems
3. **Total Flashcards Reviewed**: Times you've reviewed cards
4. **Total XP**: Experience points earned
5. **Current Streak**: Consecutive days of practice
6. **Longest Streak**: Best streak achieved
7. **Level**: Based on total XP (100 XP per level)
8. **Accuracy by Difficulty**: Percentage correct for each level

### XP System
- Flashcard marked correct: +5 XP
- Flashcard reviewed (even if incorrect): +2 XP
- Problem score: (score / 5) XP (max 20 XP for perfect 100)
- Maintains engagement through gamification

### Streak System
- Increments for each day you practice
- Resets if you miss a day
- Displayed with fire emoji (🔥) in header
- Motivates daily practice

## Database Tables Available for Practice

### customers
- customer_id, first_name, last_name, email, phone
- city, state, country
- registration_date, is_active

### products
- product_id, product_name, category
- price, cost, stock_quantity, supplier

### orders
- order_id, customer_id, order_date, ship_date
- total_amount, status

### order_items
- order_item_id, order_id, product_id
- quantity, unit_price, discount

### employees
- employee_id, first_name, last_name, email
- department, position, salary
- hire_date, manager_id (self-referencing)

### sales
- sale_id, employee_id, sale_date
- amount, region

## AI-Powered Features

### Problem Generation
- Analyzes your selected difficulty level
- Creates contextually appropriate problems
- Varies scenarios to prevent repetition
- Includes realistic business use cases

### Answer Checking
- Executes your query safely
- Compares results AND approach
- Provides constructive feedback
- Scores based on correctness and efficiency
- Praises what you did well

### Hint System
Three progressive levels:
1. **Hint 1**: Gentle nudge (e.g., "Think about which tables contain the data you need")
2. **Hint 2**: More specific (e.g., "You'll need a LEFT JOIN between customers and orders")
3. **Hint 3**: Almost there (e.g., "Use GROUP BY customer_id and COUNT(order_id) to get the count")

## Color Coding

### Difficulty Badges
- **Basic**: Light blue background, dark blue text
- **Intermediate**: Light yellow background, brown text
- **Advanced**: Light pink background, dark pink text
- **Expert**: Light purple background, dark purple text

### Feedback Colors
- **Correct**: Green border, light green background
- **Needs Work**: Yellow border, light yellow background
- **Error**: Red border, light red background

### UI Theme
- **Primary**: Indigo (#4f46e5)
- **Success**: Green (#10b981)
- **Danger**: Red (#ef4444)
- **Warning**: Orange (#f59e0b)

## Responsive Design

The app works on:
- Desktop (1400px+ optimal)
- Tablet (768px - 1400px)
- Mobile (< 768px)

Mobile adaptations:
- Stacked layouts instead of side-by-side
- Full-width buttons
- Collapsible sections
- Touch-friendly interface

## Accessibility Features

- Semantic HTML
- Keyboard navigation support
- High contrast text
- Clear error messages
- Loading states for async operations
- Descriptive button labels

## What You Can Learn

### Basic Level (Weeks 1-2)
- SELECT statements
- WHERE clause filtering
- LIKE pattern matching
- NULL handling
- Basic operators (AND, OR, NOT)
- Column and table aliases

### Intermediate Level (Weeks 3-4)
- INNER JOIN, LEFT JOIN, RIGHT JOIN
- Multiple table joins
- Self joins
- Aggregate functions (COUNT, SUM, AVG, MIN, MAX)
- GROUP BY
- HAVING clause

### Advanced Level (Weeks 5-6)
- Window functions (ROW_NUMBER, RANK, DENSE_RANK)
- LAG and LEAD
- Running totals and moving averages
- Common Table Expressions (CTEs)
- Subqueries in SELECT, FROM, WHERE
- EXISTS, IN, ANY, ALL

### Expert Level (Weeks 7+)
- Recursive CTEs
- Complex window frames
- Advanced analytics (percentiles, distributions)
- Query optimization
- Set operations (UNION, INTERSECT, EXCEPT)
- Performance considerations

## Tips for Maximum Learning

1. **Don't Rush**: Take time to understand concepts
2. **Use Hints Wisely**: Try first, then use hints if stuck
3. **Review Solutions**: Even when correct, see optimal approaches
4. **Practice Daily**: Maintain streak for best retention
5. **Progress Gradually**: Master each level before moving up
6. **Write Comments**: Comment your queries to explain your thinking
7. **Experiment**: Try different approaches to solve problems
8. **Learn from Mistakes**: Errors are learning opportunities

Enjoy your SQL learning journey!
