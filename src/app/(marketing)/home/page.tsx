"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles } from "lucide-react";
import HeroSection from "@/components/features/hero-section";
import AIChatInterface from "@/components/features/ai-chat-interface";

export default function HomePage() {
  const router = useRouter();
  const [showAIChat, setShowAIChat] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");

  const handleSearch = (query: string, useAI: boolean = false) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // If AI Search is requested, open chat interface
    if (useAI) {
      setInitialQuery(trimmedQuery);
      setShowAIChat(true);
    } else {
      // Otherwise, navigate to explore page
      router.push(`/explore?search=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const handleFilterClick = () => {
    router.push("/explore");
  };

  const handleOpenAIChat = () => {
    setInitialQuery("");
    setShowAIChat(true);
  };

  return (
    <>
      <HeroSection 
        onSearch={handleSearch} 
        onFilterClick={handleFilterClick}
      />
      
      {/* Floating AI Chat Button - Fixed Bottom Right */}
      {!showAIChat && (
        <motion.button
          onClick={handleOpenAIChat}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground p-4 rounded-full shadow-2xl shadow-primary/30 flex items-center space-x-2 group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          title="Chat with AI Assistant"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-medium">
            AI Chat
          </span>
          <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.button>
      )}

      {showAIChat && (
        <AIChatInterface
          initialQuery={initialQuery}
          onClose={() => {
            setShowAIChat(false);
            setInitialQuery("");
          }}
        />
      )}
    </>
  );
}

