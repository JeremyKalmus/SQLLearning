import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ALLOWED_TABLES = ["customers", "products", "orders", "order_items", "employees", "sales"];

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

    const url = new URL(req.url);
    const table = url.searchParams.get("table");
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    if (!table) {
      throw new Error("Table parameter is required");
    }

    if (!ALLOWED_TABLES.includes(table)) {
      throw new Error(`Table ${table} is not allowed`);
    }

    if (limit < 1 || limit > 100) {
      throw new Error("Limit must be between 1 and 100");
    }

    // Sanitize table name to prevent SQL injection
    const sanitizedTable = table.replace(/[^a-zA-Z0-9_]/g, "");
    const query = `SELECT * FROM ${sanitizedTable} LIMIT ${limit}`;

    const { data, error } = await supabase.rpc("execute_readonly_query", {
      sql_query: query,
    });

    if (error) {
      throw new Error(error.message);
    }

    return new Response(
      JSON.stringify({ rows: data || [], rowCount: data?.length || 0 }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
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


