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

    const prompt = `Generate a realistic SQL practice problem for a learning game. The database has these tables:

**customers**: customer_id, first_name, last_name, email, phone, city, state, country, registration_date, is_active
**products**: product_id, product_name, category, price, cost, stock_quantity, supplier
**orders**: order_id, customer_id, order_date, ship_date, total_amount, status
**order_items**: order_item_id, order_id, product_id, quantity, unit_price, discount
**employees**: employee_id, first_name, last_name, email, department, position, salary, hire_date, manager_id
**sales**: sale_id, employee_id, sale_date, amount, region

Create a problem at the ${difficulty} level: ${difficultyDesc}
${topic ? `Focus on this topic: ${topic}` : ""}

Return a JSON object with:
- "title": Short problem title
- "description": Clear problem statement describing what to find
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
        model: "claude-3-5-sonnet-20240620",
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

    await supabase.from("saved_problems").insert({
      user_id: user.id,
      problem_data: problem,
      last_accessed: new Date().toISOString(),
    });

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