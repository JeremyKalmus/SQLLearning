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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Authorization header" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Supabase configuration missing" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: " + (authError?.message || "User not found") }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user's API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("user_api_keys")
      .select("encrypted_api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (apiKeyError) {
      return new Response(
        JSON.stringify({ success: false, error: `Database error: ${apiKeyError.message}` }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!apiKeyData?.encrypted_api_key) {
      return new Response(
        JSON.stringify({ success: false, error: "API key not configured. Please save your API key first." }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
      let errorMessage = 'Unknown error';
      try {
        const errorData = await anthropicResponse.json();
        errorMessage = errorData.error?.message || errorData.message || `HTTP ${anthropicResponse.status}`;
      } catch (e) {
        errorMessage = `HTTP ${anthropicResponse.status}: ${anthropicResponse.statusText}`;
      }
      throw new Error(`Anthropic API error: ${errorMessage}`);
    }

    const anthropicData = await anthropicResponse.json();
    const responseText = anthropicData.content[0]?.text?.trim() || "OK";

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
    console.error("Test API key error:", error);
    
    // Try to update validation status on error, but don't fail if it doesn't work
    try {
      const authHeader = req.headers.get("Authorization");
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      
      if (authHeader && supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
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
      }
    } catch (updateError) {
      console.error("Failed to update validation status:", updateError);
    }

    // Always return 200 with error details so frontend can handle it properly
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || String(error) || "Unknown error occurred",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

