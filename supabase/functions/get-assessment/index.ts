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

    const { assessmentId } = await req.json();

    // Get assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from("skill_assessments")
      .select("*")
      .eq("id", assessmentId || 1) // Default to assessment 1
      .eq("is_active", true)
      .single();

    if (assessmentError || !assessment) {
      throw new Error("Assessment not found");
    }

    // Get all questions for this assessment
    const { data: questions, error: questionsError } = await supabase
      .from("assessment_questions")
      .select("*")
      .eq("assessment_id", assessmentId || 1)
      .order("question_order");

    if (questionsError) {
      throw new Error("Failed to fetch questions");
    }

    return new Response(
      JSON.stringify({
        assessment,
        questions: questions || [],
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
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
