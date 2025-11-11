import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface QuestionData {
  type: string;
  question: string;
  correctAnswer?: number;
  explanation?: string;
  solutionQuery?: string;
  description?: string;
  fixedQuery?: string;
  errorDescription?: string;
  blanks?: Array<{
    position: number;
    correctAnswer: string;
    acceptableAnswers?: string[];
  }>;
}

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

    const { userAssessmentId, questionId, response, timeSpentSeconds } = await req.json();

    // Get question details
    const { data: question, error: questionError } = await supabase
      .from("assessment_questions")
      .select("*")
      .eq("id", questionId)
      .single();

    if (questionError || !question) {
      throw new Error("Question not found");
    }

    const questionData = question.question_data as QuestionData;
    let isCorrect = false;
    let score = 0;
    let feedback = "";

    // Check answer based on question type
    switch (question.question_type) {
      case "multiple_choice": {
        isCorrect = response.selectedOption === questionData.correctAnswer;
        score = isCorrect ? 100 : 0;
        feedback = questionData.explanation || "";
        break;
      }

      case "write_query": {
        // Use AI to check query
        const { data: apiKeyData, error: apiKeyError } = await supabase
          .from("user_api_keys")
          .select("encrypted_api_key")
          .eq("user_id", user.id)
          .maybeSingle();

        if (apiKeyError || !apiKeyData?.encrypted_api_key) {
          throw new Error("API key not configured");
        }

        const checkResult = await checkQueryWithAI(
          apiKeyData.encrypted_api_key,
          questionData,
          response.query
        );

        isCorrect = checkResult.isCorrect;
        score = checkResult.score;
        feedback = checkResult.feedback;
        break;
      }

      case "read_query": {
        isCorrect = response.selectedOption === questionData.correctAnswer;
        score = isCorrect ? 100 : 0;
        feedback = questionData.explanation || "";
        break;
      }

      case "find_error": {
        // Check if user identified the error or provided a fix
        const fixedQuery = response.fixedQuery || response.errorDescription || "";
        const expectedFix = questionData.fixedQuery || "";
        const expectedError = questionData.errorDescription || "";

        // Simple check - if they mentioned key terms or provided a reasonable fix
        const hasKeyTerms = fixedQuery.toLowerCase().includes(expectedError.toLowerCase().split(" ")[0]);
        const providedFix = fixedQuery.trim().length > 10;

        isCorrect = hasKeyTerms && providedFix;
        score = isCorrect ? 100 : (hasKeyTerms || providedFix) ? 50 : 0;
        feedback = `${questionData.errorDescription}. Correct fix: ${expectedFix}`;
        break;
      }

      case "fill_blank": {
        const blankCheck = checkFillBlank(response.blanks, questionData.blanks || []);
        isCorrect = blankCheck.isCorrect;
        score = blankCheck.score;
        feedback = blankCheck.feedback;
        break;
      }

      default: {
        throw new Error(`Unknown question type: ${question.question_type}`);
      }
    }

    // Save response
    const { error: insertError } = await supabase
      .from("assessment_responses")
      .insert({
        user_assessment_id: userAssessmentId,
        question_id: questionId,
        user_id: user.id,
        response_data: response,
        is_correct: isCorrect,
        score,
        feedback,
        time_spent_seconds: timeSpentSeconds,
      });

    if (insertError) {
      throw new Error(`Failed to save response: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        isCorrect,
        score,
        feedback,
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

async function checkQueryWithAI(
  apiKey: string,
  questionData: QuestionData,
  userQuery: string
): Promise<{ isCorrect: boolean; score: number; feedback: string }> {
  const prompt = `Check if this SQL query correctly answers the question.

Question: ${questionData.question}
Description: ${questionData.description || ""}

Expected Solution:
${questionData.solutionQuery || ""}

Student's Query:
${userQuery}

Evaluate:
1. Is it correct?
2. Score from 0-100
3. Feedback

Respond in JSON: {"isCorrect": boolean, "score": number, "feedback": string}`;

  const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!anthropicResponse.ok) {
    const errorData = await anthropicResponse.json();
    throw new Error(`Anthropic API error: ${errorData.error?.message || "Unknown error"}`);
  }

  const anthropicData = await anthropicResponse.json();
  let content = anthropicData.content[0].text;

  // Extract JSON from code blocks if present
  if (content.includes("```json")) {
    content = content.split("```json")[1].split("```")[0].trim();
  } else if (content.includes("```")) {
    content = content.split("```")[1].split("```")[0].trim();
  }

  return JSON.parse(content);
}

function checkFillBlank(
  userBlanks: string[],
  correctBlanks: Array<{ position: number; correctAnswer: string; acceptableAnswers?: string[] }>
): { isCorrect: boolean; score: number; feedback: string } {
  if (!userBlanks || !correctBlanks || correctBlanks.length === 0) {
    return { isCorrect: false, score: 0, feedback: "No answer provided" };
  }

  let correctCount = 0;
  const feedbackItems: string[] = [];

  correctBlanks.forEach((blank, index) => {
    const userAnswer = (userBlanks[index] || "").trim().toUpperCase();
    const correctAnswer = blank.correctAnswer.toUpperCase();
    const acceptable = blank.acceptableAnswers?.map((a) => a.toUpperCase()) || [];

    if (userAnswer === correctAnswer || acceptable.includes(userAnswer)) {
      correctCount++;
    } else {
      feedbackItems.push(`Blank ${index + 1}: Expected "${correctAnswer}"`);
    }
  });

  const score = Math.round((correctCount / correctBlanks.length) * 100);
  const isCorrect = score === 100;

  return {
    isCorrect,
    score,
    feedback: isCorrect ? "All blanks correct!" : feedbackItems.join(", "),
  };
}
