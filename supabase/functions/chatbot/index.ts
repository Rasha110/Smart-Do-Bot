import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

async function generateEmbedding(text: string) {
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

    if (!response.ok) throw new Error(`Embedding failed: ${response.statusText}`);
    
    const data = await response.json();
    return data.data?.[0]?.embedding ?? [];
  } catch (err) {
    console.error("Embedding error:", err);
    return [];
  }
}

async function callOpenAI(systemPrompt: string, userQuery: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery }
      ],
      max_tokens: 1500,
      temperature: 0.2
    })
  });

  if (!response.ok) throw new Error(`OpenAI failed: ${response.statusText}`);
  
  const data = await response.json();
  return data.choices[0].message.content;
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

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error(" Missing auth header");
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error(" Auth failed:", authError);
      return jsonResponse({ error: "Authentication failed" }, 401);
    }


    const body = await req.json().catch(() => null);
    if (!body || !body.query) {
      console.error(" Invalid body");
      return jsonResponse({ error: "query required" }, 400);
    }


    // STEP 1: Generate query embedding
    const queryEmbedding = await generateEmbedding(body.query);
    if (queryEmbedding.length === 0) {
      console.error(" Embedding generation failed");
      return jsonResponse({
        reply: "Sorry, I couldn't process your question."
      }, 500);
    }

    // STEP 2: Search with embeddings
    const { data: similarTodos, error: ragErr } = await supabase.rpc("match_todos", {
      query_embedding: queryEmbedding,
      user_id_input: user.id,
      match_count: 50
    });

    if (ragErr) {
      console.error(" match_todos error:", ragErr);
      return jsonResponse({
        reply: "Sorry, I couldn't search your todos. Error: " + ragErr.message
      }, 500);
    }

    if (!similarTodos || similarTodos.length === 0) {
      return jsonResponse({
        reply: "⚠️ No indexed todos found!\n\nYour todos need embeddings to be searchable. Please click 'Generate Embeddings' button or wait a moment and try again.",
        debug: { 
          method: "EMBEDDINGS_ONLY",
          embeddingsFound: 0,
          error: "NO_EMBEDDINGS"
        }
      });
    }

  
    const { count: totalCount } = await supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: completedCount } = await supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_completed", true);

    const total = totalCount || 0;
    const completed = completedCount || 0;
    const pending = total - completed;

    console.log(`Stats: ${total} total, ${completed} completed, ${pending} pending`);

    // STEP 4: Build context
    const completedList = similarTodos.filter((t: any) => t.is_completed);
    const pendingList = similarTodos.filter((t: any) => !t.is_completed);

    const formatTodo = (t: any, idx: number) => {
      const notes = t.notes ? ` | ${t.notes}` : "";
      const date = new Date(t.created_at).toLocaleDateString();
      const match = (t.similarity * 100).toFixed(1);
      return `${idx + 1}. "${t.title}" (${date})${notes} [${match}% match]`;
    };

    const completedStr = completedList.map(formatTodo).join("\n") || "None";
    const pendingStr = pendingList.map(formatTodo).join("\n") || "None";
    
    const contextData = `
STATS: Total=${total} | Completed=${completed} | Pending=${pending}

COMPLETED (${completedList.length}):
${completedStr}

PENDING (${pendingList.length}):
${pendingStr}

All ${similarTodos.length} todos shown were found via AI semantic search.`;

    const systemPrompt = `You are a Todo Assistant using AI semantic search (embeddings).

RULES:
1. For counts: use STATS
2. For details: use listed todos only
3. Never invent titles
4. Be accurate and concise

Showing ${similarTodos.length} of ${total} todos.`;

    // STEP 5: Get AI response
    const aiResponse = await callOpenAI(systemPrompt, `${contextData}\n\nQ: ${body.query}`);

    // STEP 6: Save to history with concise context
    await supabase.from("ai_chat_history").insert([{
      user_id: user.id,
      query: body.query,
      response: aiResponse,
      embedding: queryEmbedding,
      todo_context: {
        stats: { total, completed, pending },
        found: similarTodos.length,
        completed_titles: completedList.slice(0, 5).map((t: any) => t.title),
        pending_titles: pendingList.slice(0, 5).map((t: any) => t.title),
        top_match: similarTodos[0]?.title || null
      }
    }]);

   

    return jsonResponse({
      reply: aiResponse,
      debug: {
        method: "EMBEDDINGS_ONLY",
        embeddingsFound: similarTodos.length,
        totalTodos: total,
        completedShown: completedList.length,
        pendingShown: pendingList.length,
        avgMatch: similarTodos.length > 0 
          ? ((similarTodos.reduce((s: number, t: any) => s + t.similarity, 0) / similarTodos.length) * 100).toFixed(1) + "%"
          : "0%"
      }
    });
    
  } catch (err: any) {
    console.error("FATAL ERROR:", err);
    return jsonResponse({
      error: err.message || "Unknown error",
      reply: "Something went wrong: " + (err.message || "Unknown error")
    }, 500);
  }
});