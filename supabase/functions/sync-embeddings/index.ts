import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

async function generateEmbedding(text: string) {
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

  if (!response.ok) throw new Error(`Embedding failed: ${response.statusText}`);
  
  const data = await response.json();
  return data.data?.[0]?.embedding ?? [];
}

const jsonResponse = (body: any, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }


    // ONLY GET: Generate embeddings for todos without embeddings
    if (req.method === "GET") {
      
      // ✅ NEW: Query todo_embeddings and JOIN with todos to get title & notes
      const { data: todosWithoutEmbedding, error: fetchError } = await supabase
        .from("todo_embeddings")
        .select(`
          id,
          todo_id,
          todos!inner (
            title,
            notes
          )
        `)
        .eq("user_id", user.id)
        .is("embedding", null);

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }

      if (!todosWithoutEmbedding || todosWithoutEmbedding.length === 0) {
        return jsonResponse({ 
          message: "All todos have embeddings",
          total: 0,
          success: 0,
          failed: 0,
          processed: 0
        });
      }

      
      const results = [];
      let successCount = 0;
      let failCount = 0;

      for (const todo of todosWithoutEmbedding) {
        try {
          //  Extract title and notes from the joined todos table
          const todoData = todo.todos as any;
          const title = todoData?.title || "";
          const notes = todoData?.notes || "";
          
          const text = `${title} ${notes}`.trim();
          
          const embedding = await generateEmbedding(text);
          
          if (embedding.length === 0) {
            throw new Error("Empty embedding returned");
          }

          const { error: updateError } = await supabase
            .from("todo_embeddings")
            .update({ 
              embedding,
              updated_at: new Date().toISOString()
            })
            .eq("id", todo.id);

          if (updateError) {
            throw updateError;
          }
          
          results.push({ 
            todo_id: todo.todo_id, 
            title: title,
            status: "success" 
          });
          successCount++;
          
        } catch (err) {
          console.error(`Failed for todo ${todo.todo_id}:`, err);
          const todoData = todo.todos as any;
          results.push({ 
            todo_id: todo.todo_id,
            title: todoData?.title || "Unknown", 
            status: "failed",
            error: err instanceof Error ? err.message : "Unknown error"
          });
          failCount++;
        }
      }


      return jsonResponse({ 
        message: "Batch embedding generation complete",
        total: todosWithoutEmbedding.length,
        success: successCount,
        failed: failCount,
        processed: todosWithoutEmbedding.length,
        results 
      });
    }

    return jsonResponse({ error: "Method not allowed. Use GET to generate embeddings." }, 405);
    
  } catch (err) {
    console.error(" Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: msg }, 500);
  }
});