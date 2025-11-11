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

    /**
     * Strip SQL comments from query for validation purposes
     * Handles both single-line (--) and multi-line comments
     */
    function stripComments(sql: string): string {
      if (!sql) return '';
      
      let result = sql;
      
      // Remove multi-line comments /* ... */
      result = result.replace(/\/\*[\s\S]*?\*\//g, ' ');
      
      // Remove single-line comments -- ... (matches -- to end of line or end of string)
      // Handle both \n and \r\n line endings
      result = result.replace(/--[^\r\n]*(\r?\n|$)/g, ' ');
      
      // Clean up extra whitespace (including newlines, tabs, etc.)
      result = result.replace(/\s+/g, ' ').trim();
      
      return result;
    }

    /**
     * Split queries by semicolon and validate each one
     */
    function validateMultipleQueries(sql: string): void {
      // Split original query by semicolon first (before stripping comments)
      const originalQueries = sql.split(';').map(q => q.trim()).filter(q => q.length > 0);
      
      if (originalQueries.length === 0) {
        throw new Error("No valid queries found");
      }
      
      const dangerousKeywords = [
        "DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "CREATE",
        "TRUNCATE", "GRANT", "REVOKE", "EXEC", "EXECUTE"
      ];

      // Validate each query (strip comments for validation but check original)
      let hasValidQuery = false;
      for (const originalQuery of originalQueries) {
        // Strip comments for validation
        const queryForValidation = stripComments(originalQuery);
        
        // Skip if query is empty after stripping comments (might be just comments)
        if (!queryForValidation || queryForValidation.trim().length === 0) {
          continue; // Allow queries that are just comments
        }
        
        hasValidQuery = true;
        const upperQuery = queryForValidation.toUpperCase().trim();
        
        // Check for dangerous keywords
        for (const keyword of dangerousKeywords) {
          if (upperQuery.includes(keyword)) {
            throw new Error(`Dangerous keyword detected: ${keyword}. Only SELECT and WITH (CTEs) are allowed.`);
          }
        }

        // Check that query starts with SELECT or WITH (after comment stripping)
        if (!upperQuery.startsWith("SELECT") && !upperQuery.startsWith("WITH")) {
          throw new Error(`Only SELECT and WITH (CTE) queries are allowed. Found: ${queryForValidation.substring(0, 50)}`);
        }
      }
      
      // Ensure at least one valid query exists
      if (!hasValidQuery) {
        throw new Error("No valid queries found after removing comments");
      }
    }

    // Validate all queries (with comments stripped)
    validateMultipleQueries(query);
    
    // Keep original query for execution (database function will handle multiple queries)

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

    // Check if result is an array (multiple queries) or single result
    if (Array.isArray(result) && result.length > 0 && result[0].queryIndex !== undefined) {
      // Multiple queries - normalize each result block before returning
      const normalizedResults = result.map((r: any) => {
        let rows = r.rows ?? [];
        if (typeof rows === "string") {
          try {
            rows = JSON.parse(rows);
          } catch (_) {
            rows = [];
          }
        }
        if (!Array.isArray(rows)) {
          rows = [];
        }

        let columnOrder = r.column_order ?? null;
        if (typeof columnOrder === "string") {
          try {
            columnOrder = JSON.parse(columnOrder);
          } catch (_) {
            columnOrder = null;
          }
        }
        if (!Array.isArray(columnOrder) || columnOrder.length === 0) {
          columnOrder = rows.length > 0 ? Object.keys(rows[0]) : [];
        }

        const rowCount = Array.isArray(rows) ? rows.length : 0;

        return {
          queryIndex: r.queryIndex,
          query: r.query,
          rows,
          rowCount,
          column_order: columnOrder,
          error: r.error ?? null,
        };
      });

      return new Response(
        JSON.stringify({ 
          multiple: true,
          results: normalizedResults,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      // Single query result (legacy format or single query)
      let rows;
      if (result && typeof result === 'object' && 'rows' in result) {
        rows = result.rows ?? [];
      } else {
        rows = Array.isArray(result) ? result : [];
      }

      if (typeof rows === 'string') {
        try {
          rows = JSON.parse(rows);
        } catch (_) {
          rows = [];
        }
      }

      if (!Array.isArray(rows)) {
        rows = [];
      }

      let columnOrder = null;
      if (result && typeof result === 'object' && 'column_order' in result) {
        columnOrder = result.column_order;
        if (typeof columnOrder === 'string') {
          try {
            columnOrder = JSON.parse(columnOrder);
          } catch (_) {
            columnOrder = null;
          }
        }
      }

      if (!Array.isArray(columnOrder) || columnOrder.length === 0) {
        columnOrder = rows.length > 0 ? Object.keys(rows[0]) : [];
      }

      return new Response(
        JSON.stringify({ 
          multiple: false,
          rows,
          rowCount: rows.length,
          column_order: columnOrder
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error: any) {
    console.error('Execute query error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    const errorMessage = error.message || error.error || 'Failed to execute query';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.stack || error.toString()
      }),
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