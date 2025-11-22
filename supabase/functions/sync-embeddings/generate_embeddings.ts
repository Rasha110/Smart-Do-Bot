// supabase/functions/sync-embeddings/generate_embedding.ts
export async function generateEmbedding(text: string) {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        model: "text-embedding-3-small", 
        input: text 
      })
    });
    
    if (!res.ok) throw new Error("Embedding failed");
    return (await res.json()).data[0].embedding;
  }