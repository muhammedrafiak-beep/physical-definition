export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENROUTER_API_KEY not set" });

  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "No prompt" });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://physical-definition.vercel.app",
        "X-Title": "Physical Definition",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({ error: data?.error?.message || "OpenRouter error" });
    }

    const text = data?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ result: text });

  } catch (err) {
    return res.status(200).json({ error: err.message });
  }
}
