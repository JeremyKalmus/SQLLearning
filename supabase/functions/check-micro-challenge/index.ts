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

    const { challengeId, submittedQuery, tutorialId } = await req.json();

    if (!challengeId || !submittedQuery || !tutorialId) {
      throw new Error("Missing required fields: challengeId, submittedQuery, tutorialId");
    }

    // Get challenge details
    const { data: challenge, error: challengeError } = await supabase
      .from("micro_challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challenge) {
      throw new Error("Challenge not found");
    }

    // Execute the query using execute-query function
    let executionResult;
    let executionError = null;
    try {
      const executeResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/execute-query`,
        {
          method: "POST",
          headers: {
            "Authorization": req.headers.get("Authorization")!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: submittedQuery }),
        }
      );

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json();
        throw new Error(errorData.error || "Query execution failed");
      }

      const executeData = await executeResponse.json();
      executionResult = executeData;
    } catch (error: any) {
      executionError = error.message;
    }

    if (executionError) {
      // Count attempts
      const { count } = await supabase
        .from("challenge_submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId);

      const attemptNumber = (count || 0) + 1;

      // Save submission
      await supabase.from("challenge_submissions").insert({
        user_id: user.id,
        challenge_id: challengeId,
        tutorial_id: tutorialId,
        submitted_query: submittedQuery,
        is_correct: false,
        score: 0,
        feedback: `Query execution error: ${executionError}`,
        attempt_number: attemptNumber,
      });

      return new Response(
        JSON.stringify({
          isCorrect: false,
          score: 0,
          feedback: `Query execution error: ${executionError}`,
          executionError,
          attemptNumber,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get user API key for AI evaluation
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("user_api_keys")
      .select("encrypted_api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (apiKeyError || !apiKeyData?.encrypted_api_key) {
      throw new Error("API key not configured. Please set up your API key in Settings.");
    }

    // Use AI to check answer
    const prompt = `You are checking a student's SQL query for a micro-challenge.

Challenge: ${challenge.title}
Description: ${challenge.description}

Expected Solution:
${challenge.solution_query}

Student's Query:
${submittedQuery}

Query Results: ${JSON.stringify(executionResult)}

Evaluate the student's query:
1. Is it correct? (does it solve the challenge?)
2. Give a score from 0-100
3. Provide specific feedback
4. If incorrect, give a hint without revealing the exact answer

Respond in JSON format:
{
  "isCorrect": boolean,
  "score": number,
  "feedback": string,
  "hint": string (if incorrect)
}`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKeyData.encrypted_api_key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      throw new Error("Failed to evaluate challenge");
    }

    const anthropicData = await anthropicResponse.json();
    const evaluationText = anthropicData.content[0].text;
    
    // Parse JSON from response
    let evaluation;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = evaluationText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       evaluationText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : evaluationText;
      evaluation = JSON.parse(jsonText);
    } catch (e) {
      // Fallback: try to parse the whole text
      evaluation = JSON.parse(evaluationText);
    }

    // Count attempts
    const { count } = await supabase
      .from("challenge_submissions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId);

    const attemptNumber = (count || 0) + 1;

    // Save submission
    await supabase.from("challenge_submissions").insert({
      user_id: user.id,
      challenge_id: challengeId,
      tutorial_id: tutorialId,
      submitted_query: submittedQuery,
      is_correct: evaluation.isCorrect || false,
      score: evaluation.score || 0,
      feedback: evaluation.feedback || "No feedback provided",
      attempt_number: attemptNumber,
    });

    // Update tutorial progress if correct
    if (evaluation.isCorrect) {
      await supabase.rpc("update_tutorial_challenge_progress", {
        p_user_id: user.id,
        p_tutorial_id: tutorialId,
        p_challenge_id: challengeId,
        p_score: evaluation.score || 100,
      });
    }

    return new Response(
      JSON.stringify({
        ...evaluation,
        attemptNumber,
      }),
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

