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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    // Create client for auth check
    const supabase = createClient(
      supabaseUrl,
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

    // Return hardcoded schema based on migration file
    // This matches the schema defined in 20251107223616_create_practice_database.sql
    const schema: Record<string, any> = {
      customers: {
        columns: [
          { name: 'customer_id', type: 'integer', nullable: false, primary_key: true },
          { name: 'first_name', type: 'text', nullable: false, primary_key: false },
          { name: 'last_name', type: 'text', nullable: false, primary_key: false },
          { name: 'email', type: 'text', nullable: false, primary_key: false },
          { name: 'phone', type: 'text', nullable: true, primary_key: false },
          { name: 'city', type: 'text', nullable: true, primary_key: false },
          { name: 'state', type: 'text', nullable: true, primary_key: false },
          { name: 'country', type: 'text', nullable: true, primary_key: false },
          { name: 'registration_date', type: 'date', nullable: false, primary_key: false },
          { name: 'is_active', type: 'boolean', nullable: true, primary_key: false },
        ],
        foreign_keys: [],
      },
      products: {
        columns: [
          { name: 'product_id', type: 'integer', nullable: false, primary_key: true },
          { name: 'product_name', type: 'text', nullable: false, primary_key: false },
          { name: 'category', type: 'text', nullable: false, primary_key: false },
          { name: 'price', type: 'numeric', nullable: false, primary_key: false },
          { name: 'cost', type: 'numeric', nullable: false, primary_key: false },
          { name: 'stock_quantity', type: 'integer', nullable: true, primary_key: false },
          { name: 'supplier', type: 'text', nullable: true, primary_key: false },
        ],
        foreign_keys: [],
      },
      orders: {
        columns: [
          { name: 'order_id', type: 'integer', nullable: false, primary_key: true },
          { name: 'customer_id', type: 'integer', nullable: false, primary_key: false },
          { name: 'order_date', type: 'date', nullable: false, primary_key: false },
          { name: 'ship_date', type: 'date', nullable: true, primary_key: false },
          { name: 'total_amount', type: 'numeric', nullable: false, primary_key: false },
          { name: 'status', type: 'text', nullable: false, primary_key: false },
        ],
        foreign_keys: [
          { column: 'customer_id', references_table: 'customers', references_column: 'customer_id' },
        ],
      },
      order_items: {
        columns: [
          { name: 'order_item_id', type: 'integer', nullable: false, primary_key: true },
          { name: 'order_id', type: 'integer', nullable: false, primary_key: false },
          { name: 'product_id', type: 'integer', nullable: false, primary_key: false },
          { name: 'quantity', type: 'integer', nullable: false, primary_key: false },
          { name: 'unit_price', type: 'numeric', nullable: false, primary_key: false },
          { name: 'discount', type: 'numeric', nullable: true, primary_key: false },
        ],
        foreign_keys: [
          { column: 'order_id', references_table: 'orders', references_column: 'order_id' },
          { column: 'product_id', references_table: 'products', references_column: 'product_id' },
        ],
      },
      employees: {
        columns: [
          { name: 'employee_id', type: 'integer', nullable: false, primary_key: true },
          { name: 'first_name', type: 'text', nullable: false, primary_key: false },
          { name: 'last_name', type: 'text', nullable: false, primary_key: false },
          { name: 'email', type: 'text', nullable: false, primary_key: false },
          { name: 'department', type: 'text', nullable: false, primary_key: false },
          { name: 'position', type: 'text', nullable: false, primary_key: false },
          { name: 'salary', type: 'numeric', nullable: false, primary_key: false },
          { name: 'hire_date', type: 'date', nullable: false, primary_key: false },
          { name: 'manager_id', type: 'integer', nullable: true, primary_key: false },
        ],
        foreign_keys: [
          { column: 'manager_id', references_table: 'employees', references_column: 'employee_id' },
        ],
      },
      sales: {
        columns: [
          { name: 'sale_id', type: 'integer', nullable: false, primary_key: true },
          { name: 'employee_id', type: 'integer', nullable: false, primary_key: false },
          { name: 'sale_date', type: 'date', nullable: false, primary_key: false },
          { name: 'amount', type: 'numeric', nullable: false, primary_key: false },
          { name: 'region', type: 'text', nullable: false, primary_key: false },
        ],
        foreign_keys: [
          { column: 'employee_id', references_table: 'employees', references_column: 'employee_id' },
        ],
      },
    };

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

