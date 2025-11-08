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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
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

    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      throw new Error("Query is required");
    }

    const upperQuery = query.trim().toUpperCase();
    const dangerousKeywords = [
      "DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "CREATE",
      "TRUNCATE", "GRANT", "REVOKE", "EXEC", "EXECUTE"
    ];

    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        throw new Error(`Dangerous keyword detected: ${keyword}. Only SELECT and WITH (CTEs) are allowed.`);
      }
    }

    if (!upperQuery.startsWith("SELECT") && !upperQuery.startsWith("WITH")) {
      throw new Error("Only SELECT and WITH (CTE) queries are allowed");
    }

    const { data, error } = await supabase.rpc("execute_readonly_query", {
      sql_query: query,
    });

    if (error) {
      console.error('RPC Error:', error);
      throw new Error(error.message || `Database error: ${JSON.stringify(error)}`);
    }

    // Handle case where data might be a JSON string or already parsed
    let rows = data;
    if (typeof data === 'string') {
      try {
        rows = JSON.parse(data);
      } catch (e) {
        rows = data;
      }
    }

    return new Response(
      JSON.stringify({ rows: rows || [], rowCount: Array.isArray(rows) ? rows.length : 0 }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error('Execute query error:', error);
    const errorMessage = error.message || error.error || 'Failed to execute query';
    return new Response(
      JSON.stringify({ error: errorMessage }),
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