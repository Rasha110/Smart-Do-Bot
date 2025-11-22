import { supabase } from "../todo-chat/client.ts";

export async function updateTodoContexts(
  similarTodos: any[],
  query: string,
  contextMap: Map<any, any>,
  user_id: string,
  total: number,
  completed: number,
  pending: number
) {
  const now = new Date();
  const completedList = similarTodos.filter((t: any) => t.is_completed);
  const pendingList = similarTodos.filter((t: any) => !t.is_completed);
  const allTopMatches = similarTodos.map(t => t.title);

  // Prepare new todo_context
  const newTodoContext = {
    stats: { total: total, completed: completed, pending },
    found: similarTodos.length,
    completed_titles: completedList.map((t: any) => t.title),
    pending_titles: pendingList.map((t: any) => t.title),
    top_matches: allTopMatches,
    top_match: similarTodos.map((t: any) => t.title),
    query_timestamp: now.toISOString()
  };

  // Update todo_embeddings.todo_context column with merged context
  for (const todo of similarTodos.slice(0, 10)) {
    const existingCtx = contextMap.get(todo.id) || {};
    const existingQueries = existingCtx.recent_queries || [];
    const existingCount = existingCtx.query_count || 0;

    // Merge old context with new context
    const updatedContext = {
      ...newTodoContext,
      query_count: existingCount + 1,
      recent_queries: [query, ...existingQueries].slice(0, 5),
      last_queried: now.toISOString()
    };

    await supabase
      .from("todo_embeddings")
      .update({ todo_context: updatedContext })
      .eq("todo_id", todo.id)
      .eq("user_id", user_id);
  }
}