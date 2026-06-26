import { NextRequest, NextResponse } from "next/server";

const ZHIPU_BASE_URL = process.env.ZHIPU_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || "";

async function callGLM(messages: { role: string; content: string }[], temperature = 0.4) {
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

    const response = await callGLM([
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ], 0.4);

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