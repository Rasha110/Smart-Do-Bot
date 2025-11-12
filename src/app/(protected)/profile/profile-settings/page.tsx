"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { supabase } from "../../../lib/supabase-client";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

export default function ProfileSettings() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user session
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      setUser(data.user);
      setName(data.user.user_metadata?.full_name || "");
      setEmail(data.user.email || "");
      setAvatarUrl(data.user.user_metadata?.avatar_url || null);
    };

    fetchUser();
  }, []);

  // Upload avatar
  const uploadAvatar = async (file: File) => {
    if (!file) return null;

    const sanitizedFileName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_.]/g, "");
    const filePath = `avatars/${sanitizedFileName}`;

    setIsUploading(true);

    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error("Avatar upload error:", error.message);
      setIsUploading(false);
      return null;
    }

    const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);

    setIsUploading(false);
    return publicData.publicUrl;
  };

  // Handle avatar input change
  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const url = await uploadAvatar(file);
    if (!url) return;

    // Update user metadata in Supabase Auth
    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: url, full_name: name },
    });

    if (error) {
      console.error("Error updating avatar:", error.message);
      return;
    }

    setAvatarUrl(url);
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);

    // Update Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: name, avatar_url: avatarUrl },
      email,
    });

    if (authError) {
      console.error("Profile update error:", authError.message);
      setIsSaving(false);
      return;
    }

    // Update Profiles table
    const { error: dbError } = await supabase.from("Profiles").upsert({
      auth_id: user.id,
      name,
      avatar_url: avatarUrl,
      email,
    });

    if (dbError) {
      console.error("Database update error:", dbError.message);
      setIsSaving(false);
      return;
    }

    setUser({
      ...user,
      email,
      user_metadata: { full_name: name, avatar_url: avatarUrl },
    });

    setIsSaving(false);
    alert("Profile updated successfully!");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <button
        className="mb-4 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        onClick={() => router.push("/todos")}
      >
        ← Back to Dashboard
      </button>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Profile Information</h2>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
              {isUploading ? (
                <span className="text-white font-bold text-center text-sm">Uploading...</span>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {name ? name[0].toUpperCase() : email[0].toUpperCase()}
                </span>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={isUploading}
            />
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full border rounded p-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded p-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={isSaving || isUploading}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
