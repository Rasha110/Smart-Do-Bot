"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { uploadAvatar, updateProfile, getProfile } from "@/app/actions/profile";

export default function ProfileSettings() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      const result = await getProfile();
      
      if ("error" in result) {
        router.push("/signin");
        return;
      }

      setName(result.user.name);
      setEmail(result.user.email || "");
      setAvatarUrl(result.user.avatarUrl);
    };

    fetchProfile();
  }, [router]);

  // Handle avatar upload
  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadAvatar(formData);

    setIsUploading(false);

    if ("error" in result) {
      setError(error);
      return;
    }

    setAvatarUrl(result.url);
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    if (avatarUrl) {
      formData.append("avatar_url", avatarUrl);
    }

    const result = await updateProfile(formData);

    setIsSaving(false);

    if ("error" in result) {
      setError(error);
      return;
    }

    setSuccess("Profile updated successfully!");
    setTimeout(() => setSuccess(null), 3000);
  };

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

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
              {success}
            </div>
          )}

          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
              {isUploading ? (
                <span className="text-white font-bold text-center text-sm">Uploading...</span>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {name ? name[0].toUpperCase() : email[0]?.toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <label className="cursor-pointer px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 inline-block">
                {isUploading ? "Uploading..." : "Choose Avatar"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full border rounded p-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded p-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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