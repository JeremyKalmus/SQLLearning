import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Table schema definitions
const TABLE_SCHEMAS: Record<string, string> = {
  customers: "customer_id, first_name, last_name, email, phone, city, state, country, registration_date, is_active",
  products: "product_id, product_name, category, price, cost, stock_quantity, supplier",
  orders: "order_id, customer_id, order_date, ship_date, total_amount, status",
  order_items: "order_item_id, order_id, product_id, quantity, unit_price, discount",
  employees: "employee_id, first_name, last_name, email, department, position, salary, hire_date, manager_id",
  sales: "sale_id, employee_id, sale_date, amount, region",
};

// Table relationships: which tables are directly connected
const TABLE_RELATIONSHIPS: Record<string, string[]> = {
  customers: ["orders"], // customers -> orders
  products: ["order_items"], // products -> order_items
  orders: ["customers", "order_items"], // orders -> customers, order_items
  order_items: ["orders", "products"], // order_items -> orders, products
  employees: ["sales", "employees"], // employees -> sales, employees (self-reference)
  sales: ["employees"], // sales -> employees
};

// Predefined table combinations for rotation (ensures variety)
const TABLE_COMBINATIONS: Record<string, string[][]> = {
  basic: [
    ["customers"],
    ["products"],
    ["customers", "products"],
  ],
  intermediate: [
    ["customers", "orders"],
    ["products", "order_items"],
    ["customers", "orders", "order_items"],
    ["products", "order_items", "orders"],
    ["employees", "sales"],
  ],
  advanced: [
    ["customers", "orders", "order_items", "products"],
    ["employees", "sales", "orders"],
    ["customers", "products", "orders", "order_items"],
    ["employees", "employees"], // Self-join scenario
  ],
  expert: [
    ["customers", "orders", "order_items", "products", "employees"],
    ["customers", "orders", "order_items", "products", "employees", "sales"],
    ["employees", "employees", "sales"], // Complex self-join
  ],
};

/**
 * Select tables based on difficulty and relationship constraints
 * Rotates through combinations to ensure variety
 */
function selectTables(difficulty: string, userId: string): string[] {
  const combinations = TABLE_COMBINATIONS[difficulty] || TABLE_COMBINATIONS.basic;
  
  // Combine user ID hash with current time (hour-based) for rotation
  // This ensures variety across users AND over time for the same user
  const userHash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const timeComponent = Math.floor(Date.now() / (1000 * 60 * 60)); // Changes every hour
  const combinedHash = (userHash + timeComponent) % combinations.length;
  
  return combinations[combinedHash];
}

/**
 * Get description for sub-difficulty levels
 */
function getSubDifficultyDescription(subDiff: string): string {
  const descriptions: Record<string, string> = {
    'intermediate+': 'Introduce ONE Advanced concept (Window Functions OR CTEs OR Subqueries) combined with Intermediate foundations (JOINs, GROUP BY). This is a bridge level - keep it accessible.',
    'advanced-': 'Focus on a single Advanced concept with straightforward application. Easier than standard Advanced problems.',
    'advanced': 'Standard Advanced level combining multiple Advanced techniques',
    'advanced+': 'Complex Advanced problem requiring multiple Advanced concepts and nested structures. Very challenging.'
  };
  return descriptions[subDiff] || '';
}

/**
 * Validate table selection ensures all relationships are satisfied
 * If a table is selected, its related tables should also be included if needed
 */
function validateTableSelection(selectedTables: string[], difficulty: string): string[] {
  const validated = new Set(selectedTables);
  
  // For intermediate and above, ensure relationships are complete
  if (difficulty === "intermediate" || difficulty === "advanced" || difficulty === "expert") {
    selectedTables.forEach(table => {
      const relationships = TABLE_RELATIONSHIPS[table] || [];
      relationships.forEach(relatedTable => {
        // If we're using a table that references another, include the referenced table
        if (selectedTables.includes(table)) {
          // For foreign key relationships, include the referenced table
          if (table === "orders" && !validated.has("customers")) {
            // orders.customer_id references customers, but we might not need it for all problems
            // Only add if order_items is present (indicating we need the full chain)
            if (selectedTables.includes("order_items")) {
              validated.add("customers");
            }
          }
          if (table === "order_items") {
            if (!validated.has("orders")) validated.add("orders");
            if (!validated.has("products")) validated.add("products");
          }
          if (table === "sales" && !validated.has("employees")) {
            validated.add("employees");
          }
        }
      });
    });
  }
  
  return Array.from(validated);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { difficulty = "basic", subDifficulty = null, primaryTopic = null, topic = null } = await req.json();

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("user_api_keys")
      .select("encrypted_api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (apiKeyError || !apiKeyData?.encrypted_api_key) {
      throw new Error("API key not configured");
    }

    const difficultyMap: Record<string, string> = {
      basic: "Basic SELECT, WHERE, and simple filtering",
      intermediate: "JOINs, GROUP BY, HAVING, and aggregate functions",
      advanced: "Window functions, subqueries, CTEs, and complex multi-table queries",
      expert: "Recursive CTEs, advanced analytics, and performance optimization",
    };

    const difficultyDesc = difficultyMap[difficulty] || difficultyMap.basic;

    // Select tables based on difficulty and rotation
    const selectedTables = validateTableSelection(selectTables(difficulty, user.id), difficulty);
    
    console.log(`[generate-problem] Selected tables for ${difficulty}: ${selectedTables.join(', ')}`);

    // Build schema string only for selected tables
    const schemaInfo = selectedTables
      .map(table => `**${table}**: ${TABLE_SCHEMAS[table]}`)
      .join('\n');

    // Fetch data statistics only for selected tables
    let dataStatsInfo = "";
    try {
      const statsResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/get-data-stats`, {
        method: "GET",
        headers: {
          "Authorization": req.headers.get("Authorization")!,
          "Content-Type": "application/json",
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        
        // Format statistics into readable context (only for selected tables)
        dataStatsInfo = "\n\n**IMPORTANT - Actual Data in Database**:\n";
        dataStatsInfo += "Use ONLY these values that actually exist in the database. Do NOT create problems asking for values that don't exist.\n\n";
        
        for (const tableName of selectedTables) {
          const tableStats = statsData[tableName];
          if (tableStats && typeof tableStats === 'object' && 'row_count' in tableStats) {
            dataStatsInfo += `**${tableName}** (${tableStats.row_count} rows):\n`;
            
            if (tableStats.distinct_values) {
              for (const [key, values] of Object.entries(tableStats.distinct_values)) {
                if (Array.isArray(values) && values.length > 0) {
                  dataStatsInfo += `  - ${key}: ${values.join(', ')}\n`;
                }
              }
            }
            
            if (tableStats.price_range) {
              dataStatsInfo += `  - Price range: $${tableStats.price_range.min_price} - $${tableStats.price_range.max_price} (avg: $${Math.round(tableStats.price_range.avg_price)})\n`;
            }
            if (tableStats.salary_range) {
              dataStatsInfo += `  - Salary range: $${tableStats.salary_range.min_salary} - $${tableStats.salary_range.max_salary} (avg: $${Math.round(tableStats.salary_range.avg_salary)})\n`;
            }
            if (tableStats.amount_range) {
              dataStatsInfo += `  - Amount range: $${tableStats.amount_range.min_amount} - $${tableStats.amount_range.max_amount} (avg: $${Math.round(tableStats.amount_range.avg_amount)})\n`;
            }
            if (tableStats.date_range) {
              dataStatsInfo += `  - Date range: ${tableStats.date_range.min_date} to ${tableStats.date_range.max_date}\n`;
            }
            if (tableStats.quantity_range) {
              dataStatsInfo += `  - Quantity range: ${tableStats.quantity_range.min_quantity} - ${tableStats.quantity_range.max_quantity} (avg: ${Math.round(tableStats.quantity_range.avg_quantity)})\n`;
            }
            if (tableStats.discount_range) {
              dataStatsInfo += `  - Discount range: ${tableStats.discount_range.min_discount}% - ${tableStats.discount_range.max_discount}% (avg: ${Math.round(tableStats.discount_range.avg_discount)}%)\n`;
            }
            
            dataStatsInfo += "\n";
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data stats:", error);
      // Continue without stats if there's an error
    }

    // Build sub-difficulty and topic context
    const subDifficultyContext = subDifficulty
      ? `\n**SUB-DIFFICULTY**: ${getSubDifficultyDescription(subDifficulty)}`
      : '';

    const topicContext = primaryTopic
      ? `\n**REQUIRED TOPIC**: This problem MUST focus on the SQL concept: "${primaryTopic}". The problem should test and require this concept to solve correctly. Make sure the solution demonstrates clear usage of ${primaryTopic}.`
      : (topic ? `\nFocus on this topic: ${topic}` : '');

    const prompt = `Generate a realistic and VARIED SQL practice problem for a learning game. The database has these tables:

${schemaInfo}
${dataStatsInfo}

Create a problem at the ${difficulty} level: ${difficultyDesc}${subDifficultyContext}${topicContext}

**IMPORTANT**: You can ONLY use the tables listed above (${selectedTables.join(', ')}). Do NOT reference any other tables.
**CRITICAL**: Only use values that actually exist in the database as shown above. For example:
- If countries only include "USA" or "United States", do NOT ask for "Canada" or other countries that don't exist
- If categories only include specific values, use only those categories
- If states only include certain US states, use only those states
- Use date ranges that exist in the data
- Use price/amount ranges that exist in the data

**VARIETY REQUIREMENTS**:
Generate problems with DIVERSE scenarios and approaches. Vary the following:
- Question type: comparisons, rankings, filtering, aggregations, time-series analysis, pattern matching
- Business context: sales analysis, customer behavior, inventory management, employee performance, regional comparisons
- SQL techniques: different JOIN types, window functions, subqueries, CTEs, CASE statements, date functions
- Aggregation methods: COUNT, SUM, AVG, MIN, MAX, GROUP_CONCAT, different GROUP BY strategies
- Filtering approaches: WHERE vs HAVING, multiple conditions, date ranges, pattern matching with LIKE
- Output format: single values, lists, rankings, grouped summaries, pivoted data

Be creative! Avoid generating similar "top N" or "count by category" problems repeatedly. Think of real business questions.

Return a JSON object with:
- "title": Short, descriptive problem title
- "description": Clear problem statement describing what to find (using only values that exist in the database)
- "difficulty": The difficulty level
- "sub_difficulty": The sub-difficulty level if applicable (${subDifficulty || 'null'})
- "topic": Main SQL concept being tested
- "primary_topic": The main SQL concept required for this problem (e.g., "Window Functions", "CTEs", "Subqueries", "JOINs", "Aggregates")${primaryTopic ? ` - MUST be "${primaryTopic}"` : ''}
- "concept_tags": Array of ALL SQL concepts involved (e.g., ["Window Functions", "JOINs", "Aggregates"])
- "hints": Array of exactly 3 progressive hints:
  - Hint 1 (gentle): High-level approach, which concepts/techniques to consider
  - Hint 2 (moderate): Specific tables, columns, or functions to use
  - Hint 3 (detailed): Step-by-step guidance without giving away the exact query
- "solution": The complete, correct SQL query that solves the problem
- "explanation": Brief explanation of the solution approach and key concepts used

Make it realistic, educational, and interesting. The problem should test understanding and problem-solving, not just syntax memorization.`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKeyData.encrypted_api_key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        messages: [{
          role: "user",
          content: prompt,
        }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json();
      throw new Error(`Anthropic API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const anthropicData = await anthropicResponse.json();
    let content = anthropicData.content[0].text;

    if (content.includes("```json")) {
      content = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      content = content.split("```")[1].split("```")[0].trim();
    }

    const problem = JSON.parse(content);

    // Don't save here - let the frontend handle saving to avoid duplicates
    // The frontend will save it after receiving the response

    return new Response(JSON.stringify(problem), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});