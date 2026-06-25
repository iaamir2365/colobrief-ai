import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notes, mode } = body;

    const systemPrompt = mode === "clinical_summary"
      ? "You are a clinical data analyst specializing in gastroenterology. Given symptom tracking data for an Ulcerative Colitis patient, generate a professional SBAR-format clinical summary. Be concise and medical but compassionate. Return the response as a JSON object with fields: situation (string), background (string), assessment (string), recommendation (string)."
      : "You are a helpful medical assistant that extracts structured symptom data from free-text notes. Given patient notes about their Ulcerative Colitis symptoms, extract the following fields: stoolFrequency (number 0-20), painLevel (number 1-10), bristolStoolType (number 1-7), stressLevel (number 1-10), triggers (array of strings from: Dairy, Stress, Spicy Food, NSAIDs, Alcohol, Caffeine, Lack of Sleep, Anxiety, Processed Food, Travel, Other). Return ONLY a JSON object with these fields. If you cannot determine a value, use reasonable defaults (painLevel: 3, stoolFrequency: 3, bristolStoolType: 4, stressLevel: 3, triggers: []).";

    const userContent = mode === "clinical_summary"
      ? `Analyze this UC patient data and generate a clinical summary:\n${notes}`
      : `Extract symptom data from these patient notes about their Ulcerative Colitis:\n"${notes}"`;

    // Use the z-ai-web-dev-sdk for AI
    const { createLLM } = await import("z-ai-web-dev-sdk");
    const llm = createLLM();

    const response = await llm.chat({
      model: "glm-4-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
    });

    const content = typeof response === "string" ? response : response?.content || response?.toString() || "";

    // Try to parse as JSON
    let parsed;
    try {
      // Extract JSON from possible markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      parsed = mode === "clinical_summary"
        ? {
            situation: "Unable to generate AI summary. Please review the data manually.",
            background: "See symptom log data below.",
            assessment: "Manual review recommended.",
            recommendation: "Discuss all logged symptoms and trends with your physician.",
          }
        : {
            stoolFrequency: 3,
            painLevel: 3,
            bristolStoolType: 4,
            stressLevel: 3,
            triggers: [],
          };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI extraction error:", error);
    // Return sensible defaults on error
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
      stoolFrequency: 3,
      painLevel: 3,
      bristolStoolType: 4,
      stressLevel: 3,
      triggers: [],
    });
  }
}