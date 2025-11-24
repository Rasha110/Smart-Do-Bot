// supabase/functions/todo-chat/fetch_data.ts
import { supabase } from "../todo-chat/client.ts";

export async function fetchChatHistory(user_id: string) {
  const { data: chatHistory } = await supabase
    .from("ai_chat_history")
    .select("query, response, created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(5);
  
  return (chatHistory || []).reverse();
}

export async function saveChatHistory(user_id: string, query: string, response: string) {
  const { error } = await supabase
    .from("ai_chat_history")
    .insert({
      user_id,
      query,
      response,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error("Error saving chat history:", error);
    throw error;
  }
}

export async function fetchSimilarTodos(queryEmbedding: any, user_id: string) {
  const { data: ragResults } = await supabase.rpc("match_todos", {
    query_embedding: queryEmbedding,
    user_id_input: user_id,
    match_count: 100
  });

  const todoIds = ragResults.map((r: any) => r.todo_id);
  const { data: fullTodos } = await supabase
    .from("todos")
    .select("*")
    .in("id", todoIds);

  const similarTodos = ragResults.map((rag: any) => {
    const fullTodo = fullTodos?.find((t: any) => t.id === rag.todo_id);
    return { ...fullTodo, similarity: rag.similarity };
  }).filter((t: any) => t.id);

  return similarTodos;
}

export async function fetchAllTodos(user_id: string) {
  const { data: allTodos } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  return (allTodos || []).map((t: any) => ({ ...t, similarity: 1 }));
}

// Flexible date range fetching
export async function fetchTodosInDateRange(user_id: string, startDate: string, endDate: string) {
  const { data: todos } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", user_id)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false });

  return (todos || []).map((t: any) => ({ ...t, similarity: 1 }));
}

export async function fetchExistingContexts(todoIds: any[], user_id: string) {
  const { data: existingContexts } = await supabase
    .from("todo_embeddings")
    .select("todo_id, todo_context")
    .in("todo_id", todoIds)
    .eq("user_id", user_id);

  const contextMap = new Map();
  (existingContexts || []).forEach((emb: any) => {
    contextMap.set(emb.todo_id, emb.todo_context || {});
  });

  return contextMap;
}

export async function fetchTodoStats(user_id: string) {
  const { count: total } = await supabase
    .from("todos")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user_id);

  const { count: completed } = await supabase
    .from("todos")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user_id)
    .eq("is_completed", true);

  const pending = (total || 0) - (completed || 0);

  return { total: total || 0, completed: completed || 0, pending };
}