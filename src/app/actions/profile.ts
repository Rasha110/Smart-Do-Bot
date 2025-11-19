"use server";
import { revalidatePath } from "next/cache";
import { getSupabaseAndUser } from "@/app/lib/auth-utils";

// Update profile
export async function updateProfile(formData: FormData) {
  const { supabase, user, error } = await getSupabaseAndUser();
  if (error) return { error };

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const avatarUrl = formData.get("avatar_url") as string | null;

  // Update Auth user metadata
  const { error: authError } = await supabase.auth.updateUser({
    email,
    data: { full_name: name, avatar_url: avatarUrl },
  });
  if (authError) return { error: authError.message };

  // Update Profiles table
  if (!user) return { error: "No authenticated user." };
  const { error: dbError } = await supabase.from("Profiles").upsert({
    auth_id: user.id,
    name,
    email,
    avatar_url: avatarUrl,
  });
  if (dbError) return { error: dbError.message };

  revalidatePath("/profile");
  return { success: true };
}

// Upload avatar
export async function uploadAvatar(formData: FormData) {
  const { supabase, user, error } = await getSupabaseAndUser();
  if (error) return { error };

  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const sanitizedFileName = file.name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_.]/g, "");
  const filePath = `avatars/${Date.now()}-${sanitizedFileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });
  if (uploadError) return { error: uploadError.message };

  const { data: publicData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  return { url: publicData.publicUrl };
}

// Get profile
export async function getProfile() {
  const { user, error } = await getSupabaseAndUser();
  if (error) return { error };

  if (!user) {
    return { error: "No authenticated user." };
  }
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || "",
      avatarUrl: user.user_metadata?.avatar_url || null,
    },
  };
}