"use server";
import { createClient } from "@/app/lib/supabase-server";

// Central helper to get Supabase client + authenticated user
export async function getSupabaseAndUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, error: "Not authenticated" };
  }

  return { supabase, user, error: null };
}
