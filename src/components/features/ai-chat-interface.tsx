"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
} from "lucide-react";
import CarCard from "@/components/features/car-card";
import { Car } from "@/types/car";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  recommendations?: any[];
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface AIChatInterfaceProps {
  initialQuery?: string;
  onClose: () => void;
}

export default function AIChatInterface({
  initialQuery,
  onClose,
}: AIChatInterfaceProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasProcessedInitialQuery, setHasProcessedInitialQuery] =
    useState(false);

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem("ai_chats");
    if (savedChats) {
      const parsed = JSON.parse(savedChats);
      const chatsWithDates = parsed.map((chat: any) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
      setChats(chatsWithDates);
    }

    // Create initial chat if query provided
    if (initialQuery && chats.length === 0) {
      createNewChat(initialQuery);
    }
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("ai_chats", JSON.stringify(chats));
    }
  }, [chats]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, currentChatId]);

  // Handle initial query (only once when component mounts with initialQuery)
  useEffect(() => {
    if (initialQuery && currentChatId && !hasProcessedInitialQuery) {
      const currentChat = chats.find((c) => c.id === currentChatId);
      if (currentChat && currentChat.messages.length === 0) {
        handleSendMessage(initialQuery);
        setHasProcessedInitialQuery(true);
      }
    }
  }, [initialQuery, currentChatId, hasProcessedInitialQuery, chats]);

  const createNewChat = (firstMessage?: string) => {
    const newChat: Chat = {
      id: `chat_${Date.now()}`,
      title: firstMessage
        ? firstMessage.slice(0, 30) + (firstMessage.length > 30 ? "..." : "")
        : "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChats((prevChats) => [newChat, ...prevChats]);
    setCurrentChatId(newChat.id);
  };

  const deleteChat = (chatId: string) => {
    setChats((prevChats) => prevChats.filter((c) => c.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Create chat if none exists
    let chatId = currentChatId;
    if (!chatId) {
      const newChat: Chat = {
        id: `chat_${Date.now()}`,
        title: text.slice(0, 30) + (text.length > 30 ? "..." : ""),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setChats((prevChats) => [newChat, ...prevChats]);
      chatId = newChat.id;
      setCurrentChatId(chatId);
    }

    // Add user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
              updatedAt: new Date(),
            }
          : chat
      )
    );

    setInput("");
    setIsLoading(true);

    try {
      // Call RAG API (with Groq + vector search)
      const response = await fetch("/api/ai/rag-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        recommendations: data.recommendations?.slice(0, 6) || [],
      };

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, assistantMessage],
                updatedAt: new Date(),
              }
            : chat
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content:
          "Sorry, I encountered an error. Please try again or rephrase your question.",
        timestamp: new Date(),
      };

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId
            ? { ...chat, messages: [...chat.messages, errorMessage] }
            : chat
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const currentChat = chats.find((c) => c.id === currentChatId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        exit={{ x: -300 }}
        className="w-full max-w-7xl h-full bg-card shadow-2xl flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-muted/50 border-r border-border flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-border">
                <button
                  onClick={() => createNewChat()}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">New Chat</span>
                </button>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`w-full group flex items-start justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                      currentChatId === chat.id
                        ? "bg-primary/20 border border-primary/50"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div
                      onClick={() => setCurrentChatId(chat.id)}
                      className="flex items-start space-x-2 flex-1 min-w-0 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate">
                          {chat.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {chat.messages.length} messages
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ))}

                {chats.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No chats yet. Start a new conversation!
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-bold">AI Car Assistant</h2>
                    <p className="text-xs text-muted-foreground">
                      Powered by RAG + Groq AI ⚡
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!currentChat || currentChat.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Bot className="w-16 h-16 text-primary/50" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    👋 Welcome to AI Car Assistant
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Ask me anything about cars, get recommendations, compare
                    models, or find the perfect car for your needs!
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                  {[
                    "SUV under 15 lakhs",
                    "Fuel efficient sedan",
                    "Best family car",
                    "Compare Creta vs Seltos",
                    "Electric cars in India",
                    "7 seater SUV options",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSendMessage(suggestion)}
                      className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm transition-colors cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  💡 Tip: Try asking follow-up questions for more details!
                </p>
              </div>
            ) : (
              <>
                {currentChat.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && <LoadingMessage />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end space-x-2">
                <div className="flex-1 bg-muted rounded-lg border border-border focus-within:border-primary transition-colors">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask me anything about cars..."
                    className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none"
                    rows={1}
                    style={{ minHeight: "52px", maxHeight: "200px" }}
                  />
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Chat Message Component
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex space-x-3 max-w-3xl ${
          isUser ? "flex-row-reverse space-x-reverse" : ""
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? "bg-primary" : "bg-accent"
          }`}
        >
          {isUser ? (
            <User className="w-5 h-5 text-primary-foreground" />
          ) : (
            <Bot className="w-5 h-5 text-accent-foreground" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${isUser ? "text-right" : "text-left"}`}>
          <div
            className={`inline-block px-4 py-3 rounded-lg ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>

          {/* Recommendations - Modern Cards */}
          {message.recommendations && message.recommendations.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {message.recommendations
                .map((carData: any, idx: number) => {
                  // API enriches recommendations by fetching full Car objects from MongoDB
                  // Check if enrichment was successful (has _id and proper structure)
                  if (!carData._id || !carData.brand) {
                    console.warn("Recommendation not enriched:", carData);
                    return null; // Skip non-enriched recommendations
                  }

                  const car = carData as Car;
                  const carId = car._id || `rec_${idx}`;

                  return (
                    <motion.div
                      key={carId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <CarCard
                        car={car}
                        onViewDetails={(id) => {
                          window.location.href = `/cars/${id}`;
                        }}
                        onCompare={(id) => console.log("Compare:", id)}
                        onToggleFavorite={(id) => console.log("Favorite:", id)}
                        onToggleWishlist={(id) => console.log("Wishlist:", id)}
                      />
                    </motion.div>
                  );
                })
                .filter(Boolean)}
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-1">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Loading Message Component
function LoadingMessage() {
  return (
    <div className="flex justify-start">
      <div className="flex space-x-3 max-w-3xl">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
          <Bot className="w-5 h-5 text-accent-foreground" />
        </div>
        <div className="inline-block px-4 py-3 rounded-lg bg-muted">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
