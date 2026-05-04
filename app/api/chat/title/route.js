export async function POST(req) {
  const { message } = await req.json();

  const prompt = `Generate a short, specific 3–5 word chat title for this opening health message. 
Return ONLY the title. No quotes, no punctuation at the end, no explanation.

Message: "${message}"
Title:`;

  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3:8b",
        prompt,
        stream: false,
        options: { temperature: 0.4, num_predict: 12 },
      }),
    });

    const data = await res.json();
    const title = (data.response || "Health Chat").trim().replace(/["'.]+$/, "");
    return Response.json({ title });
  } catch {
    return Response.json({ title: "Health Chat" });
  }
}