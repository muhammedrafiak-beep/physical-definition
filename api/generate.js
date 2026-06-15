export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) return res.status(200).json({ error: "HF_API_KEY not set" });

  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(200).json({ error: "No prompt" });

    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `<s>[INST] ${prompt} [/INST]`,
          parameters: {
            max_new_tokens: 1200,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      }
    );

    const data = await response.json();
    if (data?.error) return res.status(200).json({ error: data.error });
    const text = Array.isArray(data) ? data[0]?.generated_text || "" : data?.generated_text || "";
    if (!text) return res.status(200).json({ error: "Empty response" });
    return res.status(200).json({ result: text });

  } catch (err) {
    return res.status(200).json({ error: err.message });
  }
}
