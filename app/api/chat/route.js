import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { message, history = [], healthContext = "" } = await req.json();

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message is required." }, { status: 400 });
    }

    const historyText = history
      .map((m) => `${m.sender === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n");

    const lower = message.toLowerCase();

    let mode = "general";
    if (lower.includes("diet") || lower.includes("food") || lower.includes("eat") || lower.includes("nutrition") || lower.includes("meal") || lower.includes("calorie")) mode = "nutrition";
    if (lower.includes("sleep") || lower.includes("insomnia") || lower.includes("tired") || lower.includes("fatigue")) mode = "sleep";
    if (lower.includes("stress") || lower.includes("sad") || lower.includes("anxious") || lower.includes("anxiety") || lower.includes("depress") || lower.includes("overwhelm") || lower.includes("panic")) mode = "mental";
    if (lower.includes("exercise") || lower.includes("workout") || lower.includes("gym") || lower.includes("steps") || lower.includes("run") || lower.includes("walk") || lower.includes("weight")) mode = "fitness";
    if (lower.includes("water") || lower.includes("hydrat") || lower.includes("drink")) mode = "hydration";
    if (lower.includes("heart") || lower.includes("blood pressure") || lower.includes("pulse") || lower.includes("cardio")) mode = "cardio";

    const modeGuide = {
      nutrition: "Focus on practical, balanced dietary advice. Mention macros or micronutrients only if directly relevant.",
      sleep: "Give evidence-backed sleep hygiene tips. Be gentle and calming in tone.",
      mental: "Be extra empathetic and validating. Suggest professional help if distress seems serious. Never minimise feelings.",
      fitness: "Give safe, achievable exercise advice. Consider beginner-friendly modifications.",
      hydration: "Give clear hydration targets and practical tips.",
      cardio: "Offer general heart-health lifestyle advice. Always recommend seeing a doctor for symptoms.",
      general: "Give broadly helpful wellness advice.",
    };

    const healthBlock = healthContext
      ? `User's health data for today:\n${healthContext}\nUse this data naturally to personalise your answer if relevant. Do not list it back verbatim.\n\n`
      : "";

    const prompt = `You are a warm, knowledgeable AI health assistant named HealthBot.

Rules:
- Be direct, calm, and empathetic.
- Keep answers concise: 3-5 short sentences unless a list adds real value.
- Use a bullet list ONLY when listing 3+ distinct items.
- If the user seems distressed, acknowledge their feelings first.
- Never diagnose. Never replace professional medical advice.
- Do not repeat the question back.
- Do not start with "Great question!" or similar filler.
- Speak naturally, like a knowledgeable friend.
- If today's health data is provided, reference it naturally when relevant.
- Default to India-specific guidance unless the user asks about another country.
- Use Indian context for food, lifestyle, seasons, routines, healthcare access, and examples.
- Use metric units such as kg, cm, ml, litres, and Celsius.
- Do not mention US or Canada phone numbers, holidays, insurance systems, or traditions unless the user explicitly asks.
- For urgent medical help in India, suggest calling 108 or 112, or going to the nearest emergency department.

Mode: ${mode}
Mode guidance: ${modeGuide[mode] || modeGuide.general}

${healthBlock}${historyText ? `Conversation so far:\n${historyText}\n\n` : ""}User: ${message}

HealthBot:`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!geminiApiKey) {
      return Response.json(
        {
          error:
            "HealthBot is not configured. Set GEMINI_API_KEY in your environment variables.",
        },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: geminiModel,
      generationConfig: {
        temperature: 0.65,
        topP: 0.9,
        maxOutputTokens: 700,
      },
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    if (!responseText) {
      return Response.json(
        { error: "HealthBot could not generate a complete reply." },
        { status: 502 }
      );
    }

    const encoder = new TextEncoder();
    const responseParts = responseText.match(/.{1,48}(\s|$)/g) || [responseText];

    const stream = new ReadableStream({
      start(controller) {
        try {
          for (const part of responseParts) {
            controller.enqueue(
              encoder.encode(`${JSON.stringify({ response: part })}\n`)
            );
          }
          controller.close();
        } catch (err) {
          console.error("[CHAT API] Response stream failed:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("[CHAT API] Failed:", err);
    return Response.json(
      { error: "HealthBot failed to generate a reply." },
      { status: 500 }
    );
  }
}
