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

    if (!response.ok) return [];
    const data = await response.json();
    return data.data?.[0]?.embedding ?? [];
  } catch {
    return [];
  }
}

async function callOpenAI(messages: any[]) {
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
    const body = await req.json().catch(() => null);
    if (!body) {
      return jsonResponse({ error: "Invalid JSON in request body" }, 400);
    }
    const { user_id, query } = body;
    if (!user_id || !query) {
      return jsonResponse({ error: "user_id and query are required" }, 400);
    }

    // Fetch conversation history
    const { data: chatHistory } = await supabase .from("ai_chat_history").select("query, response, created_at") .eq("user_id", user_id).order("created_at", { ascending: false })  .limit(5);
    const history = (chatHistory || []).reverse();
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);
    // RAG: Semantic search
    const { data: ragResults} = await supabase.rpc("match_todos", {
      query_embedding: queryEmbedding,
      user_id_input: user_id,
      match_count: 100
    });

    // Fetch full todo data
    const todoIds = ragResults.map((r: any) => r.todo_id);
    const { data: fullTodos } = await supabase
      .from("todos")
      .select("*")
      .in("id", todoIds);

    // Merge similarity with full data 
    const similarTodos = ragResults.map((rag: any) => {
      const fullTodo = fullTodos?.find((t: any) => t.id === rag.todo_id);
      return { ...fullTodo, similarity: rag.similarity };
    }).filter((t: any) => t.id);

    // Fetch existing todo_context from todo_embeddings
    const { data: existingContexts } = await supabase
      .from("todo_embeddings")
      .select("todo_id, todo_context")
      .in("todo_id", todoIds)
      .eq("user_id", user_id);

    // Build map of existing contexts
    const contextMap = new Map();
    (existingContexts || []).forEach((emb: any) => {
      contextMap.set(emb.todo_id, emb.todo_context || {});
    });

    // Get stats
    const { count: total } = await supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id);

    const { count: completed } = await supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)
      .eq("is_completed", true);

    const pending = (total - completed);
    
    // Build context
    const completedList = similarTodos.filter((t: any) => t.is_completed);
    const pendingList = similarTodos.filter((t: any) => !t.is_completed);

    const now = new Date();
    const currentDateTime = now.toLocaleString('en-US');
//making a readable string for bot
    const formatTodo = (t: any, idx: number) => {
      const notes = t.notes ? ` | Notes: ${t.notes}` : "";
      const created = new Date(t.created_at).toLocaleString('en-US');
      const updated = new Date(t.updated_at).toLocaleString('en-US');
      const match = (t.similarity * 100).toFixed(1);
      // Check if task was updated (created_at != updated_at)
      const wasUpdated = new Date(t.created_at).getTime() !== new Date(t.updated_at).getTime() ? " Updated" : "";
      //string given to AI
      return `${idx + 1}. "${t.title}" | Created: ${created} | Updated: ${updated}${notes} [${match}%]${wasUpdated}`;
    };

    const contextData = `
CURRENT: ${currentDateTime}
STATS: Total=${total} | Completed=${completed} | Pending=${pending}

COMPLETED (${completedList.length}):
${completedList.map(formatTodo).join("\n") }

PENDING (${pendingList.length}):
${pendingList.map(formatTodo).join("\n") }`;
    // Build messages with history
    const messages = [
      {
        role: "system",
        content: `You are a Todo Assistant using AI semantic search.
RULES:
1. Use STATS for counts
2. Only reference listed todos
3. Never invent titles
4. "added/created" → check Created date
5. "updated/modified" → check Updated date
6. "updated"  means task was modified after creation
7. Use conversation history for context (understand "those", "them", "the first one")
8. Be concise and accurate
Current time is provided. Compare dates to answer "today", "yesterday", etc.
Showing ${similarTodos.length} of ${total } todos.`
      }
    ];

    // Add conversation history for context
    history.forEach((turn: any) => {
      messages.push({ role: "user", content: turn.query });
      messages.push({ role: "assistant", content: turn.response });
    });

    messages.push({ role: "user", content: `${contextData}\n\nQ: ${query}` });
    // Get AI response
    const aiResponse = await callOpenAI(messages);
    const allTopMatches = similarTodos.map(t => t.title); 
    // Prepare new todo_context
    const newTodoContext = {
      stats: { total: total, completed: completed , pending },
      found: similarTodos.length,
      completed_titles: completedList.map((t: any) => t.title),
      pending_titles: pendingList.map((t: any) => t.title),
      top_matches: allTopMatches, //  store all titles here

      top_match: similarTodos.map((t: any) => t.title),
      query_timestamp: now.toISOString()
    }; 
    // Update todo_embeddings.todo_context column with merged context
    for (const todo of similarTodos.slice(0, 10)) {
      const existingCtx = contextMap.get(todo.id) || {}; //old saved info about  todo.
      const existingQueries = existingCtx.recent_queries || [];
      const existingCount = existingCtx.query_count || 0;
      
      // Merge old context with new context
      const updatedContext = {
        ...newTodoContext,
        query_count: existingCount + 1,  // Increment count
        recent_queries: [query, ...existingQueries].slice(0, 5),  // Keep last 5
        last_queried: now.toISOString()
      };

      await supabase
        .from("todo_embeddings")
        .update({ todo_context: updatedContext })
        .eq("todo_id", todo.id)
        .eq("user_id", user_id);
    }
    return jsonResponse({ reply: aiResponse });

  } catch (err: any) {
    return jsonResponse({ reply: "Something went wrong." }, 500);
  }
});