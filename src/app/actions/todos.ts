"use server";

import { revalidatePath } from "next/cache";
import type { Task } from "@/app/lib/type";
import { getSupabaseAndUser } from "@/app/lib/auth-utils";

// Get all todos
export async function getTodos(): Promise<{ data: Task[] | null; error: string | null }> {
  const { supabase, user, error } = await getSupabaseAndUser();
  if (error) return { data: null, error };

  const { data, error: dbError } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  if (dbError) return { data: null, error: dbError.message };

  return { data: data || [], error: null };
}

// Add a todo
export async function addTodo(formData: FormData) {
  const { supabase, user, error } = await getSupabaseAndUser();
  if (error) return { error };

  const title = formData.get("title") as string;
  const notes = formData.get("notes") as string;

  if (!title?.trim()) return { error: "Title is required" };

  const { data, error: dbError } = await supabase
    .from("todos")
    .insert([
      {
        title: title.trim(),
        notes: notes?.trim() || null,
        user_id: user?.id,
        is_completed: false,
      },
    ])
    .select()
    .single();

  if (dbError) return { error: dbError.message };

  // Trigger embedding generation asynchronously
  supabase.functions
    .invoke("sync-embeddings", { method: "GET" })
    .catch((err) => console.error("Embedding sync error:", err));

  revalidatePath("/todos");
  return { data, error: null };
}

// Update a todo
export async function updateTodo(
  id: string,
  updates: { title?: string; notes?: string; is_completed?: boolean }
) {
  const { supabase, user, error } = await getSupabaseAndUser();
  if (error) return { error };

  const now = new Date().toISOString();

  const { data, error: dbError } = await supabase
    .from("todos")
    .update({ ...updates, updated_at: now })
    .eq("id", id)
    .eq("user_id", user?.id)
    .select()
    .single();

  if (dbError) return { error: dbError.message };

  // If title or notes changed, regenerate embedding
  if (updates.title || updates.notes) {
    supabase.functions
      .invoke("sync-embeddings", { method: "GET" })
      .catch((err) => console.error("Embedding sync error:", err));
  }

  revalidatePath("/todos");
  return { data, error: null };
}

// Delete a todo
export async function deleteTodo(id: string) {
  const { supabase, user, error } = await getSupabaseAndUser();
  if (error) return { error };

  const { error: dbError } = await supabase
    .from("todos")
    .delete()
    .eq("id", id)
    .eq("user_id", user?.id);

  if (dbError) return { error: dbError.message };

  revalidatePath("/todos");
  return { error: null };
}

// Toggle completion
export async function toggleTodo(id: string, isCompleted: boolean) {
  return updateTodo(id, { is_completed: !isCompleted });
}
