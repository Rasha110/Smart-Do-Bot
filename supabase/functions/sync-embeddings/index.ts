import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!, 
  Deno.env.get("SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

async function generateEmbedding(text: string) {
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

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(null, { status: 401, headers: corsHeaders });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return new Response(null, { status: 401, headers: corsHeaders });
    }

    const { data } = await supabase
      .from("todo_embeddings")
      .select(`id, todo_id, todos!inner(title, notes)`)
      .eq("user_id", user.id)
      .is("embedding", null);

    for (const todo of data || []) {
      try {
        const text = `${todo.todos.title} ${todo.todos.notes || ""}`.trim();
        const embedding = await generateEmbedding(text);
        await supabase
          .from("todo_embeddings")
          .update({ embedding })
          .eq("id", todo.id);
      } catch {}
    }

    return new Response(null, { status: 204, headers: corsHeaders });
    
  } catch {
    return new Response(null, { status: 500, headers: corsHeaders });
  }
});