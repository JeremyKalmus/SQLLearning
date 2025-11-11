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

    // Handle both GET and POST requests
    let difficulty, topic;
    if (req.method === "GET") {
      const url = new URL(req.url);
      difficulty = url.searchParams.get("difficulty") || undefined;
      topic = url.searchParams.get("topic") || undefined;
    } else {
      const body = await req.json().catch(() => ({}));
      difficulty = body.difficulty;
      topic = body.topic;
    }

    let query = supabase
      .from("tutorials")
      .select("*")
      .order("order_index", { ascending: true });

    if (difficulty && difficulty !== "all") {
      query = query.eq("difficulty_tier", difficulty);
    }

    if (topic && topic !== "all") {
      query = query.eq("topic", topic);
    }

    const { data: tutorials, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Get user progress if authenticated
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: progress } = await supabase
          .from("tutorial_progress")
          .select("*")
          .eq("user_id", user.id);

        // Merge progress into tutorials
        const tutorialsWithProgress = tutorials.map((tutorial: any) => {
          const userProgress = progress?.find((p: any) => p.tutorial_id === tutorial.id);
          return {
            ...tutorial,
            userProgress: userProgress || { status: "not_started" },
          };
        });

        return new Response(JSON.stringify(tutorialsWithProgress), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      }
    }

    return new Response(JSON.stringify(tutorials || []), {
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

