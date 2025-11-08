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

    const { level = "basic", topic = null, count = 5 } = await req.json();

    if (!["basic", "intermediate", "advanced", "expert"].includes(level)) {
      throw new Error("Invalid level. Must be: basic, intermediate, advanced, or expert");
    }

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("user_api_keys")
      .select("encrypted_api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (apiKeyError || !apiKeyData?.encrypted_api_key) {
      throw new Error("API key not configured");
    }

    const difficultyMap: Record<string, string> = {
      basic: "Basic SELECT, WHERE, and simple filtering",
      intermediate: "JOINs, GROUP BY, HAVING, and aggregate functions",
      advanced: "Window functions, subqueries, CTEs, and complex multi-table queries",
      expert: "Recursive CTEs, advanced analytics, and performance optimization",
    };

    const difficultyDesc = difficultyMap[level] || difficultyMap.basic;

    const prompt = `Generate exactly ${count} SQL learning flashcards for a flashcard study system.

**Difficulty Level**: ${level} - ${difficultyDesc}
${topic ? `**Focus Topic**: ${topic}` : ""}

Each flashcard should follow this format:
- **topic**: A concise topic name (e.g., "SELECT DISTINCT", "INNER JOIN", "Window Functions")
- **question**: A clear, specific question about SQL concepts
- **answer**: A concise, accurate answer (1-2 sentences or a short list)
- **explanation**: A brief explanation (2-3 sentences) that helps students understand the concept
- **example**: A practical SQL code example demonstrating the concept (formatted as code)

The flashcards should:
- Cover different aspects of SQL at the ${level} level
- Be educational and help students learn SQL concepts
- Have clear, unambiguous answers
- Include practical examples that reinforce learning
- Test understanding, not just memorization

Return a JSON array with exactly ${count} flashcard objects. Each object should have:
- "topic": string
- "question": string
- "answer": string
- "explanation": string
- "example": string

Example format:
[
  {
    "topic": "SELECT DISTINCT",
    "question": "How do you remove duplicate rows from query results?",
    "answer": "SELECT DISTINCT",
    "explanation": "DISTINCT removes duplicate rows from the result set. It applies to all selected columns together.",
    "example": "SELECT DISTINCT city, state\\nFROM customers;"
  },
  ...
]

Make sure the flashcards are diverse and cover different SQL concepts at the ${level} level.`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKeyData.encrypted_api_key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3000,
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

    const flashcards = JSON.parse(content);

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error("Invalid response format from AI - expected array of flashcards");
    }

    // Validate and prepare flashcards for database
    const validatedFlashcards = flashcards.map((card: any, index: number) => {
      if (!card.topic || !card.question || !card.answer) {
        throw new Error("Flashcard missing required fields: topic, question, or answer");
      }
      // Generate a unique ID for AI-generated flashcards
      const cardId = `${level}_ai_${Date.now()}_${index}`;
      return {
        id: cardId,
        level,
        topic: card.topic,
        question: card.question,
        answer: card.answer,
        explanation: card.explanation || null,
        example: card.example || null,
        is_ai_generated: true,
      };
    });

    // Insert flashcards into database using service role
    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: insertedCards, error: insertError } = await serviceSupabase
      .from("flashcards")
      .insert(validatedFlashcards)
      .select();

    if (insertError) {
      console.error("Error inserting flashcards:", insertError);
      throw new Error(`Failed to save flashcards: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ flashcards: insertedCards }), {
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

