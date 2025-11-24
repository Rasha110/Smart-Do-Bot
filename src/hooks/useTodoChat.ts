import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/app/lib/supabase-browser";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const supabase = createBrowserSupabaseClient();

/**
 * Custom Hook: Fetch authenticated user ID
 */
export function useUserId() {
  return useQuery({
    queryKey: ["userId"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        throw new Error("No user found. Please log in.");
      }
      return data.user.id;
    },
    retry: false,
    staleTime: Infinity
  });
}

/**
 * Custom Hook: Fetch chat history for a user
 */
export function useChatHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ["chatHistory", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: chatHistory, error } = await supabase
        .from("ai_chat_history")
        .select("query, response, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!chatHistory) return [];

      const reversed = chatHistory.reverse();
      const historyMessages: Message[] = [];

      reversed.forEach((record) => {
        historyMessages.push({
          id: `user-${record.created_at}-${Math.random()}`,
          role: "user",
          content: record.query,
          timestamp: record.created_at
        });
        historyMessages.push({
          id: `assistant-${record.created_at}-${Math.random()}`,
          role: "assistant",
          content: record.response,
          timestamp: record.created_at
        });
      });

      return historyMessages;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

/**
 * Custom Hook: Send a message to the chatbot
 */
export function useSendMessage(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (query: string) => {
      if (!userId) throw new Error("User not authenticated");

      const { data, error } = await supabase.functions.invoke("todo-chat", {
        body: { user_id: userId, query }
      });

      if (error) {
        const details = error.context ? JSON.stringify(error.context) : error.message;
        throw new Error(`Chatbot error: ${details}`);
      }

      if (!data || !data.reply) {
        throw new Error("Invalid response from chatbot");
      }

      return data.reply as string;
    },
    onSuccess: async () => {
      // Invalidate and refetch chat history after successful message
      await queryClient.invalidateQueries({ queryKey: ["chatHistory", userId] });
      await queryClient.refetchQueries({ queryKey: ["chatHistory", userId] });
    }
  });
}