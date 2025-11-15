"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase-client";
import { CheckCircle2, LogOut, User, MessageCircle } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { TodoChatbot } from "@/components/todo/ChatBot";

export default function NavBar({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/signin");
        return;
      }
      setUser(data.user);
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (!session) router.push("/signin");
        else setUser(session.user);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-semibold">
        Loading user session...
      </div>
    );

  const fullName = user.user_metadata?.full_name || "";
  const email = user.email || "";

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/todos")}
          >
            <CheckCircle2 className="text-blue-600 w-7 h-7" />
            <h1 className="text-xl font-bold">My Todo App</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Chatbot Icon Button */}
            <button
              onClick={() => setChatbotOpen(!chatbotOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
              title="Open Todo Assistant"
            >
              <MessageCircle className="w-5 h-5" />
            </button>

            {/* Avatar and Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white font-semibold overflow-hidden hover:ring-2 hover:ring-blue-300 transition-all"
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (fullName || email)[0].toUpperCase()
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-55 bg-white border rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium">
                      {fullName || email.split("@")[0]}
                    </p>
                    <p className="text-xs text-gray-500">{email}</p>
                  </div>

                  <button
                    onClick={() => {
                      router.push("/profile/profile-settings");
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <User className="h-4 w-4" /> Profile
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">{children}</main>

  
      {chatbotOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white rounded-xl w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl">
            <TodoChatbot onClose={() => setChatbotOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}