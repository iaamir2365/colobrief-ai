import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedAuth } from "@/lib/api-auth";

const ZHIPU_BASE_URL = process.env.ZHIPU_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || "";

async function callGLM(messages: { role: string; content: string }[], temperature = 0.3) {
  const res = await fetch(`${ZHIPU_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ZHIPU_API_KEY}`,
    },
    body: JSON.stringify({
      model: "GLM-4.7-Flash",
      messages,
      temperature,
      thinking: { type: "disabled" },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GLM API error ${res.status}: ${err}`);
  }
  return res.json();
}

const EXTRACT_SYSTEM_PROMPT = `Analyze this unstructured patient daily log for Ulcerative Colitis. Extract the symptoms and map them strictly to this JSON format. If a symptom is not mentioned, use null or default values:
{
"painLevel": number (1-10 based on context, e.g., "severe" is 8, "mild" is 3, "none" is 0),
"stoolFrequency": number (count of bathroom trips mentioned),
"stoolType": number (1-7 based on Bristol Stool Scale, e.g., "loose/watery" is 6 or 7, "solid/formed" is 4),
"stressLevel": number (1-10 based on context),
"bloodInStool": boolean (true if blood, bleeding, or red spots are mentioned, false otherwise),
"urgencyLevel": "none" | "mild" | "moderate" | "severe",
"triggers": Array of strings matching these exact options: ["Dairy", "Stress", "Spicy Food", "NSAIDs", "Alcohol", "Caffeine", "Lack of Sleep", "Anxiety", "Processed Food", "Travel"]
}
Return ONLY this JSON object. No other text or conversational filler.`;

const CLINICAL_SYSTEM_PROMPT = "You are a clinical data analyst specializing in gastroenterology. Given symptom tracking data for an Ulcerative Colitis patient, generate a professional SBAR-format clinical summary. Be concise and medical but compassionate. Return the response as a JSON object with fields: situation (string), background (string), assessment (string), recommendation (string).";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireVerifiedAuth(request);
    if (userId instanceof NextResponse) return userId;

    const body = await request.json();
    const { notes, mode } = body;

    const systemPrompt = mode === "clinical_summary"
      ? CLINICAL_SYSTEM_PROMPT
      : EXTRACT_SYSTEM_PROMPT;

    const userContent = mode === "clinical_summary"
      ? `Analyze this UC patient data and generate a clinical summary:\n${notes}`
      : `Extract symptom data from these patient notes about their Ulcerative Colitis:\n"${notes}"`;

    const response = await callGLM([
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ], 0.3);

    const content = response?.choices?.[0]?.message?.content || "";

    // Try to parse as JSON
    let parsed;
    try {
      // Extract JSON from possible markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      if (mode === "clinical_summary") {
        parsed = {
          situation: "Unable to generate AI summary. Please review the data manually.",
          background: "See symptom log data below.",
          assessment: "Manual review recommended.",
          recommendation: "Discuss all logged symptoms and trends with your physician.",
        };
      } else {
        parsed = {
          painLevel: null,
          stoolFrequency: null,
          stoolType: null,
          stressLevel: null,
          bloodInStool: null,
          urgencyLevel: null,
          triggers: [],
        };
      }
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI extraction error:", error);
    const body = await request.json().catch(() => ({}));
    if (body.mode === "clinical_summary") {
      return NextResponse.json({
        situation: "AI summary unavailable.",
        background: "Please review data manually.",
        assessment: "Unable to generate automated assessment.",
        recommendation: "Discuss all logged symptoms with your physician.",
      });
    }
    return NextResponse.json({
      painLevel: null,
      stoolFrequency: null,
      stoolType: null,
      stressLevel: null,
      bloodInStool: null,
      urgencyLevel: null,
      triggers: [],
    });
  }
}