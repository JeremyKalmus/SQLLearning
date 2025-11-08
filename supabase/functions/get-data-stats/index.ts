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

    const stats: Record<string, any> = {};

    // Get statistics for each table
    for (const table of ALLOWED_TABLES) {
      try {
        // Get row count
        const { data: countData, error: countError } = await supabase.rpc("execute_readonly_query", {
          sql_query: `SELECT COUNT(*) as count FROM ${table}`,
        });

        let rowCount = 0;
        if (!countError && countData) {
          // Handle new format with rows property or legacy array format
          const rows = (countData as any)?.rows || (Array.isArray(countData) ? countData : []);
          if (rows.length > 0 && rows[0].count) {
            rowCount = rows[0].count || 0;
          }
        }

        const tableStats: any = {
          row_count: rowCount,
        };

        // Get distinct values for categorical columns
        if (table === "customers") {
          const { data: countryData } = await supabase.rpc("execute_readonly_query", {
            sql_query: `SELECT DISTINCT country FROM ${table} WHERE country IS NOT NULL ORDER BY country`,
          });
          const { data: stateData } = await supabase.rpc("execute_readonly_query", {
            sql_query: `SELECT DISTINCT state FROM ${table} WHERE state IS NOT NULL ORDER BY state LIMIT 20`,
          });
          const { data: cityData } = await supabase.rpc("execute_readonly_query", {
            sql_query: `SELECT DISTINCT city FROM ${table} WHERE city IS NOT NULL ORDER BY city LIMIT 20`,
          });

          const countryRows = (countryData as any)?.rows || (Array.isArray(countryData) ? countryData : []);
          const stateRows = (stateData as any)?.rows || (Array.isArray(stateData) ? stateData : []);
          const cityRows = (cityData as any)?.rows || (Array.isArray(cityData) ? cityData : []);
          
          tableStats.distinct_values = {
            countries: countryRows.map((r: any) => r.country).filter((v: any) => v) || [],
            states: stateRows.map((r: any) => r.state).filter((v: any) => v) || [],
            cities: cityRows.map((r: any) => r.city).filter((v: any) => v) || [],
          };
        } else if (table === "products") {
          const { data: categoryData } = await supabase.rpc("execute_readonly_query", {
            sql_query: `SELECT DISTINCT category FROM ${table} ORDER BY category`,
          });
          const { data: supplierData } = await supabase.rpc("execute_readonly_query", {
            sql_query: `SELECT DISTINCT supplier FROM ${table} WHERE supplier IS NOT NULL ORDER BY supplier LIMIT 20`,
          });
          const { data: priceRange } = await supabase.rpc("execute_readonly_query", {
            sql_query: `SELECT MIN(price) as min_price, MAX(price) as max_price, AVG(price) as avg_price FROM ${table}`,
          });

          const categoryRows = (categoryData as any)?.rows || (Array.isArray(categoryData) ? categoryData : []);
          const supplierRows = (supplierData as any)?.rows || (Array.isArray(supplierData) ? supplierData : []);
          const priceRows = (priceRange as any)?.rows || (Array.isArray(priceRange) ? priceRange : []);
          
          tableStats.distinct_values = {
            categories: categoryRows.map((r: any) => r.category).filter((v: any) => v) || [],
            suppliers: supplierRows.map((r: any) => r.supplier).filter((v: any) => v) || [],
          };
          if (priceRows.length > 0) {
            tableStats.price_range = priceRows[0];
          }
        } else if (table === "orders") {
          const { data: statusData } = await supabase.rpc("execute_readonly_query", {
            sql_query: `SELECT DISTINCT status FROM ${table} ORDER BY status`,
          });
          const { data: dateRange } = await supabase.rpc("execute_readonly_query", {
            sql_query: `SELECT MIN(order_date) as min_date, MAX(order_date) as max_date FROM ${table}`,
          });
          const { data: amountRange } = await supabase.rpc("execute_readonly_query", {
            sql_query: `SELECT MIN(total_amount) as min_amount, MAX(total_amount) as max_amount, AVG(total_amount) as avg_amount FROM ${table}`,
          });

          const statusRows = (statusData as any)?.rows || (Array.isArray(statusData) ? statusData : []);
          const dateRows = (dateRange as any)?.rows || (Array.isArray(dateRange) ? dateRange : []);
          const amountRows = (amountRange as any)?.rows || (Array.isArray(amountRange) ? amountRange : []);
          
          tableStats.distinct_values = {
            statuses: statusRows.map((r: any) => r.status).filter((v: any) => v) || [],
          };
          if (dateRows.length > 0) {
            tableStats.date_range = dateRows[0];
          }
          if (amountRows.length > 0) {
            tableStats.amount_range = amountRows[0];
          }
        } else if (table === "employees") {
          const { data: deptData } = await supabase.rpc("execute_readonly_query", {
            sql_query: `SELECT DISTINCT department FROM ${table} ORDER BY department`,
          });
          const { data: positionData } = await supabase.rpc("execute_readonly_query", {
            sql_query: `SELECT DISTINCT position FROM ${table} ORDER BY position LIMIT 20`,
          });
          const { data: salaryRange } = await supabase.rpc("execute_readonly_query", {
            sql_query: `SELECT MIN(salary) as min_salary, MAX(salary) as max_salary, AVG(salary) as avg_salary FROM ${table}`,
          });

          const deptRows = (deptData as any)?.rows || (Array.isArray(deptData) ? deptData : []);
          const positionRows = (positionData as any)?.rows || (Array.isArray(positionData) ? positionData : []);
          const salaryRows = (salaryRange as any)?.rows || (Array.isArray(salaryRange) ? salaryRange : []);
          
          tableStats.distinct_values = {
            departments: deptRows.map((r: any) => r.department).filter((v: any) => v) || [],
            positions: positionRows.map((r: any) => r.position).filter((v: any) => v) || [],
          };
          if (salaryRows.length > 0) {
            tableStats.salary_range = salaryRows[0];
          }
        } else if (table === "sales") {
          const { data: regionData } = await supabase.rpc("execute_readonly_query", {
            sql_query: `SELECT DISTINCT region FROM ${table} ORDER BY region`,
          });
          const { data: dateRange } = await supabase.rpc("execute_readonly_query", {
            sql_query: `SELECT MIN(sale_date) as min_date, MAX(sale_date) as max_date FROM ${table}`,
          });
          const { data: amountRange } = await supabase.rpc("execute_readonly_query", {
            sql_query: `SELECT MIN(amount) as min_amount, MAX(amount) as max_amount, AVG(amount) as avg_amount FROM ${table}`,
          });

          const regionRows = (regionData as any)?.rows || (Array.isArray(regionData) ? regionData : []);
          const dateRows = (dateRange as any)?.rows || (Array.isArray(dateRange) ? dateRange : []);
          const amountRows = (amountRange as any)?.rows || (Array.isArray(amountRange) ? amountRange : []);
          
          tableStats.distinct_values = {
            regions: regionRows.map((r: any) => r.region).filter((v: any) => v) || [],
          };
          if (dateRows.length > 0) {
            tableStats.date_range = dateRows[0];
          }
          if (amountRows.length > 0) {
            tableStats.amount_range = amountRows[0];
          }
        }

        stats[table] = tableStats;
      } catch (error) {
        console.error(`Error getting stats for ${table}:`, error);
        stats[table] = { error: "Failed to get statistics" };
      }
    }

    return new Response(JSON.stringify(stats), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
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

