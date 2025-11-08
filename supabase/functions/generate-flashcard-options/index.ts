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

    const { card_id, correct_answer, question, topic, difficulty } = await req.json();

    if (!card_id || !correct_answer || !question) {
      throw new Error("card_id, correct_answer, and question are required");
    }

    // Check if options are already cached
    const { data: cachedOptions } = await supabase
      .from("flashcard_options")
      .select("options")
      .eq("card_id", card_id)
      .maybeSingle();

    if (cachedOptions?.options) {
      return new Response(JSON.stringify({ options: cachedOptions.options }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Get user's API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("user_api_keys")
      .select("encrypted_api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (apiKeyError || !apiKeyData?.encrypted_api_key) {
      throw new Error("API key not configured");
    }

    const prompt = `You are creating multiple choice options for a SQL learning flashcard.

**Topic**: ${topic || "SQL"}
**Difficulty Level**: ${difficulty || "basic"}
**Question**: ${question}
**Correct Answer**: ${correct_answer}

Generate exactly 3 plausible but INCORRECT answer options. These should be:
- Related to the topic but factually wrong
- Common misconceptions or mistakes students make
- Similar in length and complexity to the correct answer
- Believable enough to test understanding, not just guessing

Return a JSON array with exactly 3 strings, each being one wrong answer option.
Example format: ["wrong answer 1", "wrong answer 2", "wrong answer 3"]

Make the wrong answers educational - they should help students learn by understanding why they're incorrect.`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKeyData.encrypted_api_key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
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
    let content = anthropicData.content[0].text;

    // Extract JSON from markdown code blocks if present
    if (content.includes("```json")) {
      content = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      content = content.split("```")[1].split("```")[0].trim();
    }

    const wrongAnswers = JSON.parse(content);

    if (!Array.isArray(wrongAnswers) || wrongAnswers.length !== 3) {
      throw new Error("Invalid response format from AI");
    }

    // Create options array with correct answer + 3 wrong answers
    const options = [
      { text: correct_answer, correct: true },
      ...wrongAnswers.map((text: string) => ({ text, correct: false }))
    ];

    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    // Cache the options in the database
    await supabase.from("flashcard_options").upsert({
      card_id,
      options,
      user_id: user.id,
    }, {
      onConflict: "user_id,card_id",
    });

    return new Response(JSON.stringify({ options }), {
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

