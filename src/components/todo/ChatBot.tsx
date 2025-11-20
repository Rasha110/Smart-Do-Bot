"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/common/Input";
import Button from "@/components/common/Button";
import { Send, Bot, User, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/app/lib/supabase-browser";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const createMessage = (role: "user" | "assistant", content: string, timestamp?: string): Message => ({
  id: `${Date.now()}-${Math.random()}`,
  role,
  content,
  timestamp: timestamp || new Date().toISOString()
});
const supabase = createBrowserSupabaseClient();
export function TodoChatbot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    createMessage("assistant", "Hi! I'm your AI todo assistant. Ask me anything about your tasks!")
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasLoadedHistory = useRef(false);

  useEffect(() => {
    if (hasLoadedHistory.current) return;
    
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          setAuthError("Failed to get user authentication");
          setIsLoadingHistory(false);
          return;
        }

        if (!data.user) {
          setAuthError("No user found. Please log in.");
          setIsLoadingHistory(false);
          return;
        }

        setUserId(data.user.id);
        await loadChatHistory(data.user.id);
        if (!hasLoadedHistory.current) {
          hasLoadedHistory.current = true;
          loadChatHistory(data.user.id);
        }
              } catch (err) {
        setAuthError("Error retrieving authentication");
        setIsLoadingHistory(false);
      }
    };

    getUser();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ 
      top: scrollRef.current.scrollHeight, 
      behavior: 'smooth' 
    });
  }, [messages]);

  const loadChatHistory = async (uid: string) => {
    try {
      setIsLoadingHistory(true);
      
      const { data: chatHistory, error } = await supabase
        .from("ai_chat_history")
        .select("query, response, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: true })
        .limit(250);

      if (error) {
        setIsLoadingHistory(false);
        return;
      }

      if (!chatHistory || chatHistory.length === 0) {
        setIsLoadingHistory(false);
        return;
      }

      const historyMessages: Message[] = [];
      
      chatHistory.forEach((record) => {
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

      setMessages(prev => {
        // Avoid wiping already loaded messages
        if (prev.length > 1) return prev;
        return [
          createMessage("assistant", "Hi! I'm your AI todo assistant. Ask me anything about your tasks!"),
          ...historyMessages
        ];
      });
      
      
      setIsLoadingHistory(false);
    } catch (err) {
      setIsLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !userId || isLoading) return;

    const userMessage = createMessage("user", input);
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { 
          user_id: userId,
          query: userMessage.content 
        }
      });

      if (error) {
        const errorDetails = error.context ? JSON.stringify(error.context) : error.message;
        throw new Error(`Chatbot error: ${errorDetails || "Failed to get response"}`);
      }

      if (!data || !data.reply) {
        throw new Error("Invalid response from chatbot");
      }

      const assistantMessage = createMessage("assistant", data.reply);
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong.";
      const errorMessage = createMessage("assistant", `Error: ${errorMsg}`);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
console.log("messge",messages)
  return (
    <div className="h-full flex flex-col bg-white rounded-lg border-0 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-white flex justify-between items-center flex-shrink-0">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" /> 
            <h2 className="text-lg font-bold">AI Todo Assistant</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {userId ? "Powered by semantic search" : "Loading..."}
          </p>
        </div>
        <Button 
          variant="cancel"
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-4 w-4 text-gray-600" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
        {authError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{authError}</p>
          </div>
        )}
        
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading chat history...</p>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={`rounded-lg px-4 py-2 max-w-[70%] break-words ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-white text-gray-900 border border-gray-200"}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <span className={`text-xs mt-1 block ${msg.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-lg px-4 py-2 bg-white border border-gray-200">
                  <p className="text-sm text-gray-600 animate-pulse">Thinking...</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white flex gap-2 flex-shrink-0">
        <Input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()} 
          placeholder="Ask about your todos..." 
          disabled={isLoading || !userId || !!authError}
          className="flex-1"          
        />
        <Button 
          variant="primary"
          onClick={handleSend} 
          disabled={isLoading || !userId || !!authError}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}