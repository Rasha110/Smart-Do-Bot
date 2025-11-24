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
  const now = new Date().toISOString();
  
  // Process only top 10 results
  for (let i = 0; i < Math.min(10, similarTodos.length); i++) {
    const currentTodo = similarTodos[i];
    const existingCtx = contextMap.get(currentTodo.id) || {};
    
    // 🔥 ONLY extract valid query_history, ignore ALL other fields
    let validQueryHistory: any[] = [];
    
    if (existingCtx.query_history && Array.isArray(existingCtx.query_history)) {
      validQueryHistory = existingCtx.query_history.filter((q: any) => 
        q.my_rank !== undefined && 
        q.co_matched_todos !== undefined &&
        q.my_todo_id !== undefined
      );
    }
    
    // Extract only these specific stats
    const timesQueried = existingCtx.times_queried || 0;
    const firstQueriedAt = existingCtx.first_queried_at;

    // Build co_matched_todos for THIS specific todo
   // Rank todos FOR THIS todo individually
const coMatchedTodos = similarTodos
  .filter(t => t.id !== currentTodo.id)
  .map(t => ({
    todo_id: t.id,
    title: t.title,
    similarity_diff: Math.abs(t.similarity - currentTodo.similarity)
  }))
  .sort((a, b) => a.similarity_diff - b.similarity_diff);


    // Build new query entry
    const newQueryEntry = {
      query: query,
      timestamp: now,
      my_rank: i + 1,
      my_similarity: currentTodo.similarity,
      my_todo_id: currentTodo.id,
      my_title: currentTodo.title,
      co_matched_todos: coMatchedTodos,
      stats_at_query: {
        total_todos: total,
        completed_todos: completed,
        pending_todos: pending,
        results_returned: similarTodos.length
      }
    };

    // Build the NEW context (completely fresh, only these fields)
    const newContext = {
      query_history: [
        newQueryEntry,
        ...validQueryHistory.slice(0, 9)
      ],
      times_queried: timesQueried + 1,
      first_queried_at: firstQueriedAt || now,
      last_queried_at: now,
      avg_rank: 0 // Will calculate below
    };
    
    // Calculate average rank
    newContext.avg_rank = parseFloat(
      (newContext.query_history.reduce((sum: number, q: any) => sum + q.my_rank, 0) / 
      newContext.query_history.length).toFixed(2)
    );
   
    //  REPLACE entire context (not merge)
    const { error } = await supabase
      .from("todo_embeddings")
      .update({ todo_context: newContext })
      .eq("todo_id", currentTodo.id)
      .eq("user_id", user_id);
    
    if (error) {
      console.error(`Failed to update context for todo ${currentTodo.id}:`, error);
    }
  }
}