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

    // Get all responses for this assessment
    const { data: responses, error: responsesError } = await supabase
      .from("assessment_responses")
      .select(`
        *,
        question:assessment_questions(specific_skills, skill_category, difficulty_weight)
      `)
      .eq("user_assessment_id", userAssessmentId);

    if (responsesError) {
      throw new Error(`Failed to fetch responses: ${responsesError.message}`);
    }

    if (!responses || responses.length === 0) {
      throw new Error("No responses found for this assessment");
    }

    // Calculate overall score
    const totalScore = responses.reduce((sum: number, r: AssessmentResponse) => sum + r.score, 0);
    const overallScore = Math.round(totalScore / responses.length);

    // Calculate skill scores
    const skillScores = calculateSkillScores(responses);

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
