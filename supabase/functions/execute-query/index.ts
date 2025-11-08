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

    let { query } = await req.json();

    if (!query || typeof query !== "string") {
      throw new Error("Query is required");
    }

    // Strip trailing semicolons to avoid SQL errors
    query = query.trim().replace(/;+$/, '');

    /**
     * Strip SQL comments from query for validation purposes
     * Handles both single-line (--) and multi-line (/* */) comments
     */
    function stripComments(sql: string): string {
      let result = sql;
      
      // Remove multi-line comments /* ... */
      result = result.replace(/\/\*[\s\S]*?\*\//g, ' ');
      
      // Remove single-line comments -- ... (but not inside strings)
      // Simple approach: replace -- to end of line, but be careful of -- in strings
      // For validation purposes, this simple approach is sufficient
      result = result.replace(/--[^\r\n]*/g, ' ');
      
      // Clean up extra whitespace
      result = result.replace(/\s+/g, ' ').trim();
      
      return result;
    }

    // Strip comments for validation (but keep original query for execution)
    const queryForValidation = stripComments(query);
    const upperQuery = queryForValidation.toUpperCase();
    
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
    let result = data;
    if (typeof data === 'string') {
      try {
        result = JSON.parse(data);
      } catch (e) {
        result = data;
      }
    }

    // Handle new format with column_order, or legacy format (array of rows)
    let rows, columnOrder;
    if (result && typeof result === 'object' && 'rows' in result) {
      rows = result.rows || [];
      columnOrder = result.column_order || null;
    } else {
      // Legacy format - just an array
      rows = Array.isArray(result) ? result : [];
      columnOrder = null;
    }

    return new Response(
      JSON.stringify({ 
        rows: rows || [], 
        rowCount: Array.isArray(rows) ? rows.length : 0,
        column_order: columnOrder
      }),
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