import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const { difficulty = "basic", topic = null } = await req.json();

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

    // Fetch data statistics to provide context about actual data in tables
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
        
        // Format statistics into readable context
        dataStatsInfo = "\n\n**IMPORTANT - Actual Data in Database**:\n";
        dataStatsInfo += "Use ONLY these values that actually exist in the database. Do NOT create problems asking for values that don't exist.\n\n";
        
        for (const [tableName, tableStats] of Object.entries(statsData)) {
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
            
            dataStatsInfo += "\n";
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data stats:", error);
      // Continue without stats if there's an error
    }

    const prompt = `Generate a realistic SQL practice problem for a learning game. The database has these tables:

**customers**: customer_id, first_name, last_name, email, phone, city, state, country, registration_date, is_active
**products**: product_id, product_name, category, price, cost, stock_quantity, supplier
**orders**: order_id, customer_id, order_date, ship_date, total_amount, status
**order_items**: order_item_id, order_id, product_id, quantity, unit_price, discount
**employees**: employee_id, first_name, last_name, email, department, position, salary, hire_date, manager_id
**sales**: sale_id, employee_id, sale_date, amount, region
${dataStatsInfo}

Create a problem at the ${difficulty} level: ${difficultyDesc}
${topic ? `Focus on this topic: ${topic}` : ""}

**CRITICAL**: Only use values that actually exist in the database as shown above. For example:
- If countries only include "USA" or "United States", do NOT ask for "Canada" or other countries that don't exist
- If categories only include specific values, use only those categories
- If states only include certain US states, use only those states
- Use date ranges that exist in the data
- Use price/amount ranges that exist in the data

Return a JSON object with:
- "title": Short problem title
- "description": Clear problem statement describing what to find (using only values that exist in the database)
- "difficulty": The difficulty level
- "topic": Main SQL concept being tested
- "hints": Array of 3 progressive hints (from gentle to more specific)
- "solution": The correct SQL query
- "explanation": Brief explanation of the solution approach

Make it realistic and educational. The problem should test understanding, not just syntax memorization.`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKeyData.encrypted_api_key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
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