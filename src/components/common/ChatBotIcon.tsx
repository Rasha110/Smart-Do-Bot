"use client";

import { TodoChatbot } from "../todo/ChatBot";

interface ChatbotIconProps {
  onClose: () => void;
}

export function ChatbotIcon({ onClose }: ChatbotIconProps) {
  return <TodoChatbot onClose={onClose} />;
}