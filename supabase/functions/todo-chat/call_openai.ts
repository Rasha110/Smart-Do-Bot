import { OPENAI_API_KEY } from "../todo-chat/client.ts";

export async function callOpenAI(messages: any[]) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 1500,
      temperature: 0.2
    })
  });

  if (!response.ok) throw new Error("OpenAI failed");
  const data = await response.json();
  return data.choices[0].message.content;
}