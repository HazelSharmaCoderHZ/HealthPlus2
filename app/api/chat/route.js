import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ reply: "Please enter a message." }, { status: 400 });
    }

    const prompt = `
You are a supportive AI health assistant.

Rules:
- Be calm, empathetic, and helpful
- If user expresses distress, respond supportively
- Encourage seeking real help when needed
- Keep tone gentle and non-judgmental
- Do not diagnose conditions or replace professional medical care

User: ${message}
`;

    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3:8b",
        prompt,
        stream: true,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}`);
    }

    if (!res.body) {
      throw new Error("No response body from Ollama");
    }

    return new Response(res.body, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Ollama API error:", error);

    return NextResponse.json(
      { reply: "Chatbot failed. Try again." },
      { status: 500 }
    );
  }
}
