import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AssessmentResponse {
  score: number;
  question: {
    specific_skills: string[];
    skill_category: string;
    difficulty_weight: number;
  };
}

interface SkillScores {
  [skill: string]: number;
}

interface Recommendations {
  suggestedDifficulty: string;
  topicsToFocus: string[];
  tutorialsToTake: string[];
  practiceProblems: string[];
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

    const { userAssessmentId, timeSpentSeconds } = await req.json();

    // Get all responses for this assessment with full question data
    const { data: responses, error: responsesError } = await supabase
      .from("assessment_responses")
      .select(`
        *,
        question:assessment_questions(id, question_type, question_data, specific_skills, skill_category, difficulty_weight)
      `)
      .eq("user_assessment_id", userAssessmentId);

    if (responsesError) {
      throw new Error(`Failed to fetch responses: ${responsesError.message}`);
    }

    if (!responses || responses.length === 0) {
      throw new Error("No responses found for this assessment");
    }

    // Check if there are any write_query questions that need AI evaluation
    const hasWriteQueryQuestions = responses.some(
      (r) => r.question?.question_type === "write_query" && r.score === 0
    );

    // Get API key for AI checking (only needed if there are write_query questions)
    let apiKeyData: { encrypted_api_key: string } | null = null;
    if (hasWriteQueryQuestions) {
      const { data, error: apiKeyError } = await supabase
        .from("user_api_keys")
        .select("encrypted_api_key")
        .eq("user_id", user.id)
        .maybeSingle();

      if (apiKeyError || !data?.encrypted_api_key) {
        throw new Error("API key not configured. Required for evaluating write_query questions.");
      }
      apiKeyData = data;
    }

    // Evaluate all write_query responses with AI
    if (hasWriteQueryQuestions && apiKeyData) {
      for (const response of responses) {
        if (response.question?.question_type === "write_query" && response.score === 0) {
          const responseData = response.response_data as any;
          
          // Skip if the question was skipped by the user
          if (responseData?.skipped === true) {
            continue;
          }
          
          const questionData = response.question.question_data as any;
          const userQuery = responseData?.query || "";

          if (userQuery.trim()) {
            try {
              const checkResult = await checkQueryWithAI(
                apiKeyData.encrypted_api_key,
                questionData,
                userQuery
              );

              // Update the response with AI evaluation results
              const { error: updateError } = await supabase
                .from("assessment_responses")
                .update({
                  is_correct: checkResult.isCorrect,
                  score: checkResult.score,
                  feedback: checkResult.feedback,
                })
                .eq("id", response.id);

              if (updateError) {
                console.error(`Failed to update response ${response.id}:`, updateError);
              } else {
                // Update the response object for score calculation
                response.is_correct = checkResult.isCorrect;
                response.score = checkResult.score;
                response.feedback = checkResult.feedback;
              }
            } catch (error) {
              console.error(`Error evaluating write_query response ${response.id}:`, error);
              // Continue with other responses even if one fails
            }
          }
        }
      }
    }

    // Re-fetch responses to get updated scores
    const { data: updatedResponses, error: updatedError } = await supabase
      .from("assessment_responses")
      .select(`
        *,
        question:assessment_questions(specific_skills, skill_category, difficulty_weight)
      `)
      .eq("user_assessment_id", userAssessmentId);

    if (updatedError) {
      throw new Error(`Failed to fetch updated responses: ${updatedError.message}`);
    }

    const finalResponses = updatedResponses || responses;

    // Calculate overall score
    const totalScore = finalResponses.reduce((sum: number, r: AssessmentResponse) => sum + r.score, 0);
    const overallScore = Math.round(totalScore / finalResponses.length);

    // Calculate skill scores
    const skillScores = calculateSkillScores(finalResponses);

    // Generate recommendations
    const recommendations = generateRecommendations(skillScores);

    // Update user assessment
    const { error: updateError } = await supabase
      .from("user_assessments")
      .update({
        completed_at: new Date().toISOString(),
        status: "completed",
        time_spent_seconds: timeSpentSeconds,
        overall_score: overallScore,
        skill_scores: skillScores,
        recommendations,
      })
      .eq("id", userAssessmentId);

    if (updateError) {
      throw new Error(`Failed to update assessment: ${updateError.message}`);
    }

    // Update user skill profile
    const weakSkills = Object.entries(skillScores)
      .filter(([_, score]) => score < 60)
      .map(([skill]) => skill);

    const strongSkills = Object.entries(skillScores)
      .filter(([_, score]) => score > 80)
      .map(([skill]) => skill);

    const recommendedLevel = determineRecommendedLevel(skillScores);

    const { error: profileError } = await supabase
      .from("user_skill_profiles")
      .upsert(
        {
          user_id: user.id,
          skill_scores: skillScores,
          last_assessment_id: userAssessmentId,
          last_assessed_at: new Date().toISOString(),
          recommended_level: recommendedLevel,
          weak_skills: weakSkills,
          strong_skills: strongSkills,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (profileError) {
      console.error("Failed to update skill profile:", profileError);
      // Don't throw - profile update is not critical
    }

    return new Response(
      JSON.stringify({
        overallScore,
        skillScores,
        recommendations,
        recommendedLevel,
        weakSkills,
        strongSkills,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in complete-assessment:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred",
        details: error.stack 
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

function calculateSkillScores(responses: AssessmentResponse[]): SkillScores {
  const skillTotals: { [key: string]: number } = {};
  const skillCounts: { [key: string]: number } = {};

  responses.forEach((response: AssessmentResponse) => {
    if (response.question && response.question.specific_skills) {
      response.question.specific_skills.forEach((skill: string) => {
        if (!skillTotals[skill]) {
          skillTotals[skill] = 0;
          skillCounts[skill] = 0;
        }
        const weight = response.question.difficulty_weight || 1.0;
        skillTotals[skill] += response.score * weight;
        skillCounts[skill] += weight;
      });
    }
  });

  const skillScores: SkillScores = {};
  Object.keys(skillTotals).forEach((skill) => {
    skillScores[skill] = Math.round(skillTotals[skill] / skillCounts[skill]);
  });

  return skillScores;
}

function generateRecommendations(skillScores: SkillScores): Recommendations {
  const recommendations: Recommendations = {
    suggestedDifficulty: "",
    topicsToFocus: [],
    tutorialsToTake: [],
    practiceProblems: [],
  };

  // Identify weak areas
  const weakSkills = Object.entries(skillScores)
    .filter(([_, score]) => score < 60)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);

  recommendations.topicsToFocus = weakSkills.map(([skill]) => skill);

  // Map skills to tutorials (simplified - in production, query tutorials table)
  const tutorialMapping: { [key: string]: string } = {
    "Window Functions": "intro-to-window-functions",
    "CTEs": "common-table-expressions",
    "Subqueries": "subqueries-fundamentals",
    "Self-Joins": "self-joins-explained",
    "JOINs": "mastering-joins",
    "GROUP BY": "grouping-and-aggregates",
    "Aggregates": "sql-aggregate-functions",
  };

  recommendations.tutorialsToTake = weakSkills
    .map(([skill]) => tutorialMapping[skill])
    .filter((tutorial) => tutorial !== undefined);

  return recommendations;
}

function determineRecommendedLevel(skillScores: SkillScores): string {
  const basicSkills = ["SELECT Fundamentals", "WHERE Clause", "ORDER BY", "DISTINCT"];
  const intermediateSkills = ["JOINs", "Aggregates", "GROUP BY", "HAVING"];
  const advancedSkills = ["Window Functions", "CTEs", "Subqueries", "Self-Joins"];

  const avgBasic = getAvgForCategory(skillScores, basicSkills);
  const avgIntermediate = getAvgForCategory(skillScores, intermediateSkills);
  const avgAdvanced = getAvgForCategory(skillScores, advancedSkills);

  if (avgAdvanced > 70) return "advanced";
  if (avgIntermediate > 70) return "intermediate+";
  if (avgIntermediate > 40) return "intermediate";
  return "basic";
}

function getAvgForCategory(skillScores: SkillScores, skills: string[]): number {
  const scores = skills.map((s) => skillScores[s] || 0).filter((s) => s > 0);
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

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
