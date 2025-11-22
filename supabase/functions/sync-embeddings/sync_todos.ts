// supabase/functions/sync-embeddings/sync_todos.ts
import { supabase } from "../sync-embeddings/client.ts";
import { generateEmbedding } from "../sync-embeddings/generate_embeddings.ts";

export async function syncTodoEmbeddings(userId: string) {
  const { data } = await supabase
    .from("todo_embeddings")
    .select(`id, todo_id, todos!inner(title, notes)`)
    .eq("user_id", userId)
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
}