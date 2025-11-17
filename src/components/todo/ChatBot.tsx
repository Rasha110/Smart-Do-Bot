"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Input } from "@/components/common/Input";
import Button from "@/components/common/Button";
import { Send, Bot, User, X } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const createMessage = (role: "user" | "assistant", content: string): Message => ({
  id: Date.now().toString(),
  role,
  content,
  timestamp: new Date().toISOString()
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function TodoChatbot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    createMessage("assistant", "Hi! I'm your AI todo assistant. Ask me anything about your tasks!")
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.error("Auth error:", error);
          setAuthError("Failed to get user authentication");
          return;
        }

        if (!data.user) {
          setAuthError("No user found. Please log in.");
          return;
        }

        setUserId(data.user.id);
        loadChatHistory(data.user.id);
      } catch (err) {
        console.error("Error getting user:", err);
        setAuthError("Error retrieving authentication");
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

  const loadChatHistory = (uid: string) => {
    try {
      const saved = localStorage.getItem(`chatbot_history_${uid}`);
      if (!saved) return;
      
      const history = JSON.parse(saved);
      if (Array.isArray(history) && history.length > 0) {
        setMessages(history);
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  const saveChatHistory = (msgs: Message[]) => {
    if (!userId) return;
    
    try {
      localStorage.setItem(`chatbot_history_${userId}`, JSON.stringify(msgs));
    } catch (err) {
      console.error("Error saving chat history:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !userId || isLoading) return;

    const userMessage = createMessage("user", input);
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    saveChatHistory(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("No valid session found. Please log in again.");
      }

      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { query: userMessage.content }
      });

      if (error) {
        console.error("Full error object:", error);
        const errorDetails = error.context ? JSON.stringify(error.context) : error.message;
        throw new Error(`Chatbot error: ${errorDetails || "Failed to get response"}`);
      }

      if (!data || !data.reply) {
        throw new Error("Invalid response from chatbot");
      }

      const assistantMessage = createMessage("assistant", data.reply);
      const finalMessages = [...updatedMessages, assistantMessage];
      
      setMessages(finalMessages);
      saveChatHistory(finalMessages);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong.";
      console.error("Chat error:", errorMsg);
      
      const errorMessage = createMessage("assistant", `Error: ${errorMsg}`);
      const finalMessages = [...updatedMessages, errorMessage];
      
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

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