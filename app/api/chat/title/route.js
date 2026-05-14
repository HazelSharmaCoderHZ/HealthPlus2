import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  const { message } = await req.json();

  const prompt = `Generate a short, specific 3-5 word chat title for this opening health message.
Return ONLY the title. No quotes, no punctuation at the end, no explanation.

Message: "${message}"
Title:`;

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return Response.json({ title: "Health Chat" });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 12,
      },
    });

    const result = await model.generateContent(prompt);
    const title = (result.response.text() || "Health Chat")
      .trim()
      .replace(/["'.]+$/, "");

    return Response.json({ title });
  } catch (err) {
    console.error("[CHAT TITLE API] Failed:", err);
    return Response.json({ title: "Health Chat" });
  }
}
