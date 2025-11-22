import { OPENAI_API_KEY } from "../todo-chat/client.ts";

export async function generateEmbedding(text: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text
      })
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.data?.[0]?.embedding ?? [];
  } catch {
    return [];
  }
}