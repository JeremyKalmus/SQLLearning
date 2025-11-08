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

    const { problem_description, query, hint_level, difficulty, topic } = await req.json();

    if (!problem_description) {
      throw new Error("Problem description is required");
    }

    if (hint_level < 1 || hint_level > 3) {
      throw new Error("Hint level must be between 1 and 3");
    }

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("user_api_keys")
      .select("encrypted_api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (apiKeyError || !apiKeyData?.encrypted_api_key) {
      throw new Error("API key not configured");
    }

    // Fetch database schema
    const schemaResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/get-schema`, {
      method: "GET",
      headers: {
        "Authorization": req.headers.get("Authorization")!,
        "Content-Type": "application/json",
      },
    });

    let schemaInfo = "";
    if (schemaResponse.ok) {
      const schemaData = await schemaResponse.json();
      schemaInfo = `\n\n**Database Schema**:\n${JSON.stringify(schemaData, null, 2)}`;
    }

    const hintLevels = {
      1: "Give a very gentle nudge in the right direction without revealing the solution. Help them think about what they need to find or which tables might be relevant.",
      2: "Provide more specific guidance about which SQL concepts or clauses to use. Mention specific table names or columns that might be helpful, but don't give away the exact query structure.",
      3: "Give a detailed hint that almost reveals the solution but requires the student to put it together. You can mention specific SQL functions, JOIN types, or WHERE conditions, but still leave some thinking for them to do."
    };

    const hintInstruction = hintLevels[hint_level as keyof typeof hintLevels] || hintLevels[1];
    const difficultyInfo = difficulty ? `\n**Problem Difficulty**: ${difficulty}` : '';
    const topicInfo = topic ? `\n**Topic**: ${topic}` : '';

    const prompt = `You are a SQL tutor providing a hint to a student.

**Problem**: ${problem_description}${difficultyInfo}${topicInfo}${schemaInfo}

**Student's Current Query** (may be empty or incomplete):
\`\`\`sql
${query || "No query yet"}
\`\`\`

**Hint Level**: ${hint_level}/3

${hintInstruction}

Provide a single helpful hint as plain text. Be encouraging and Socratic - help them think through the problem rather than just giving the answer. Keep it concise (2-3 sentences maximum).`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKeyData.encrypted_api_key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: prompt,
        }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json();
      throw new Error(`Anthropic API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const anthropicData = await anthropicResponse.json();
    let hint = anthropicData.content[0].text.trim();

    // Remove any quotes that might wrap the hint
    if (hint.startsWith('"') && hint.endsWith('"')) {
      hint = hint.slice(1, -1);
    }
    if (hint.startsWith("'") && hint.endsWith("'")) {
      hint = hint.slice(1, -1);
    }

    return new Response(JSON.stringify({ hint }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
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

