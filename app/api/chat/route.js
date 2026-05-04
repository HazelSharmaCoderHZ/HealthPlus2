export async function POST(req) {
  const { message, history, healthContext } = await req.json();

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
    nutrition:  "Focus on practical, balanced dietary advice. Mention macros or micronutrients only if directly relevant.",
    sleep:      "Give evidence-backed sleep hygiene tips. Be gentle and calming in tone.",
    mental:     "Be extra empathetic and validating. Suggest professional help if distress seems serious. Never minimise feelings.",
    fitness:    "Give safe, achievable exercise advice. Consider beginner-friendly modifications.",
    hydration:  "Give clear hydration targets and practical tips.",
    cardio:     "Offer general heart-health lifestyle advice. Always recommend seeing a doctor for symptoms.",
    general:    "Give broadly helpful wellness advice.",
  };

  // Health context block — only injected when data exists
  const healthBlock = healthContext
    ? `User's health data for today:\n${healthContext}\nUse this data naturally to personalise your answer if relevant. Do not list it back verbatim.\n\n`
    : "";

  const prompt = `You are a warm, knowledgeable AI health assistant named Aria.

Rules:
- Be direct, calm, and empathetic.
- Keep answers concise: 3–5 short sentences unless a list adds real value.
- Use a bullet list ONLY when listing 3+ distinct items.
- If the user seems distressed, acknowledge their feelings first.
- Never diagnose. Never replace professional medical advice.
- Do not repeat the question back.
- Do not start with "Great question!" or similar filler.
- Speak naturally, like a knowledgeable friend.
- If today's health data is provided, reference it naturally when relevant (e.g. "Since you've only had X glasses of water today…").

Mode: ${mode}
Mode guidance: ${modeGuide[mode] || modeGuide.general}

${healthBlock}${historyText ? `Conversation so far:\n${historyText}\n\n` : ""}User: ${message}

Aria:`;

  const ollamaRes = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3:8b",
      prompt,
      stream: true,
      options: {
        temperature: 0.65,
        top_p: 0.9,
        repeat_penalty: 1.15,
        num_predict: 180,
      },
    }),
  });

  return new Response(ollamaRes.body);
}