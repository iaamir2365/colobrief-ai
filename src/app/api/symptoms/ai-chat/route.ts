import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, symptomData } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required." },
        { status: 400 }
      );
    }

    // Find the last user message
    const lastUserMessage = [...messages]
      .reverse()
      .find((m: { role: string }) => m.role === "user");

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "No user message found." },
        { status: 400 }
      );
    }

    const systemPrompt =
      "You are a helpful UC symptom analysis assistant. You analyze the patient's symptom data and provide insights. Be concise, empathetic, and medically informative but always remind them to consult their doctor. Use markdown formatting. Keep responses under 200 words.";

    const userContent = `Here is my symptom data in JSON:\n${symptomData}\n\nMy question: ${lastUserMessage.content}`;

    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      model: "glm-4-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.4,
    });

    const content = response?.choices?.[0]?.message?.content || "";

    return NextResponse.json({ message: content });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response. Please try again." },
      { status: 500 }
    );
  }
}