"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/common/Input";
import Button from "@/components/common/Button";
import { Send, Bot, User, X } from "lucide-react";
import { useUserId, useChatHistory, useSendMessage } from "@/hooks/useTodoChat";

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

export function TodoChatbot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    createMessage("assistant", "Hi! I'm your AI todo assistant. Ask me anything about your tasks!")
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Use custom hooks
  const { data: userId, error: authError, isLoading: isLoadingUser } = useUserId();
  const { data: chatHistory, isLoading: isLoadingHistory } = useChatHistory(userId);
  const sendMessage = useSendMessage(userId);

  // Load chat history into messages
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      setMessages(prev => {
        // Only add history if we just have the welcome message
        if (prev.length === 1 && prev[0].role === "assistant") {
          return [prev[0], ...chatHistory];
        }
        return prev;
      });
    }
  }, [chatHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !userId || sendMessage.isPending) return;

    const userMessage = createMessage("user", input);
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");

    try {
      const reply = await sendMessage.mutateAsync(currentInput);
      const assistantMessage = createMessage("assistant", reply);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Something went wrong.";
      const errorMessage = createMessage("assistant", `Error: ${errorMsg}`);
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const isLoading = isLoadingUser || isLoadingHistory;
  const hasError = !!authError;

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
        
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{authError?.message}</p>
          </div>
        )}

        {isLoading ? (
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

                <div className={`rounded-lg px-4 py-2 max-w-[70%] break-words ${
                  msg.role === "user" ? "bg-blue-500 text-white" : "bg-white text-gray-900 border border-gray-200"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <span className={`text-xs mt-1 block ${
                    msg.role === "user" ? "text-blue-100" : "text-gray-500"
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>

                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {sendMessage.isPending && (
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
          disabled={sendMessage.isPending || !userId || hasError}
          className="flex-1"
        />
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={sendMessage.isPending || !userId || hasError}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

    </div>
  );
}