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
    );

    // Migration SQL
    const migrationSQL = `
-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  example TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_flashcards_level ON flashcards(level);
CREATE INDEX IF NOT EXISTS idx_flashcards_level_created ON flashcards(level, created_at, is_ai_generated);

-- Enable Row Level Security
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read flashcards
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'flashcards' 
    AND policyname = 'Anyone can read flashcards'
  ) THEN
    CREATE POLICY "Anyone can read flashcards"
      ON flashcards FOR SELECT
      USING (true);
  END IF;
END $$;

-- RLS Policy: Allow inserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'flashcards' 
    AND policyname = 'Allow flashcard inserts'
  ) THEN
    CREATE POLICY "Allow flashcard inserts"
      ON flashcards FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;
`;

    // Execute migration using RPC (requires a function in database)
    // Since we can't execute raw SQL directly, we'll use the postgres extension
    const { error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    }).catch(async () => {
      // If RPC doesn't exist, try direct query (won't work but shows error)
      return { error: { message: "Cannot execute SQL directly. Need to create exec_sql function first." } };
    });

    if (error) {
      // Try alternative: use postgrest-js to execute via SQL function
      // Actually, we need to create a helper function in the database first
      return new Response(
        JSON.stringify({ 
          error: "Migration requires database function. Please run this SQL first in Supabase SQL Editor (if available), or use the alternative method.",
          sql: migrationSQL,
          alternative: "Use scripts/run-migration-direct.js with database password, or ask Bolt.new AI to run the migration"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Migration completed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

