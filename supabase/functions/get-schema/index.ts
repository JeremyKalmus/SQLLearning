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

    // Query to get schema information for practice tables
    const schemaQuery = `
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        CASE 
          WHEN pk.column_name IS NOT NULL THEN true 
          ELSE false 
        END as is_primary_key
      FROM information_schema.tables t
      JOIN information_schema.columns c 
        ON t.table_name = c.table_name 
        AND t.table_schema = c.table_schema
      LEFT JOIN (
        SELECT ku.table_name, ku.column_name, ku.table_schema
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
          AND tc.table_schema = ku.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
      ) pk ON c.table_name = pk.table_name 
        AND c.column_name = pk.column_name
        AND c.table_schema = pk.table_schema
      WHERE t.table_schema = 'public'
        AND t.table_name IN ('customers', 'products', 'orders', 'order_items', 'employees', 'sales')
      ORDER BY t.table_name, c.ordinal_position;
    `;

    const { data: columnsData, error: columnsError } = await supabase.rpc("execute_readonly_query", {
      sql_query: schemaQuery,
    });

    if (columnsError) {
      throw new Error(columnsError.message);
    }

    // Query to get foreign key relationships
    const fkQuery = `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name IN ('customers', 'products', 'orders', 'order_items', 'employees', 'sales');
    `;

    const { data: fkData, error: fkError } = await supabase.rpc("execute_readonly_query", {
      sql_query: fkQuery,
    });

    if (fkError) {
      throw new Error(fkError.message);
    }

    // Build schema object
    const schema: Record<string, any> = {};
    const fkMap = new Map<string, any[]>();

    // Build foreign key map
    if (fkData) {
      for (const fk of fkData) {
        const key = `${fk.table_name}.${fk.column_name}`;
        if (!fkMap.has(key)) {
          fkMap.set(key, []);
        }
        fkMap.get(key)!.push({
          column: fk.column_name,
          references_table: fk.foreign_table_name,
          references_column: fk.foreign_column_name,
        });
      }
    }

    // Build schema structure
    if (columnsData) {
      for (const col of columnsData) {
        const tableName = col.table_name;
        if (!schema[tableName]) {
          schema[tableName] = {
            columns: [],
            foreign_keys: [],
          };
        }

        const fkKey = `${tableName}.${col.column_name}`;
        const foreignKeys = fkMap.get(fkKey) || [];

        schema[tableName].columns.push({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === "YES",
          primary_key: col.is_primary_key,
        });

        // Add foreign keys if not already added
        for (const fk of foreignKeys) {
          const exists = schema[tableName].foreign_keys.some(
            (existing: any) => existing.column === fk.column
          );
          if (!exists) {
            schema[tableName].foreign_keys.push(fk);
          }
        }
      }
    }

    return new Response(
      JSON.stringify(schema),
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

