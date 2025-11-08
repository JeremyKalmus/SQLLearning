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

    // Get user's API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("user_api_keys")
      .select("encrypted_api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (apiKeyError || !apiKeyData?.encrypted_api_key) {
      throw new Error("API key not configured");
    }

    // Make a minimal test call to Anthropic API
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKeyData.encrypted_api_key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 10,
        messages: [{
          role: "user",
          content: "Say 'OK' if you can read this.",
        }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json();
      throw new Error(`Anthropic API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const anthropicData = await anthropicResponse.json();
    const responseText = anthropicData.content[0].text.trim();

    // Update the API key validation status
    await supabase
      .from("user_api_keys")
      .update({
        is_valid: true,
        last_validated: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "API key is valid and working!",
        response: responseText,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Update validation status on error
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
      if (user) {
        await supabase
          .from("user_api_keys")
          .update({
            is_valid: false,
            last_validated: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      }
    } catch (updateError) {
      // Ignore update errors
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
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

