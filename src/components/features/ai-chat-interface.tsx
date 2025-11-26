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
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
                      className="flex items-start space-x-2 flex-1 min-w-0"
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
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-opacity"
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
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
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
                className="p-2 hover:bg-muted rounded-lg transition-colors"
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
                      className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm transition-colors"
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
                  className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              {message.recommendations.map((carData: any, idx: number) => {
                // Extract car ID - try multiple possible fields
                let carId = carData._id || carData.id || carData.ID;
                if (carId && typeof carId === 'object' && carId.toString) {
                  carId = carId.toString();
                }
                if (!carId || carId === 'car_0' || carId === 'car_1') {
                  // Try to find ID in other fields or generate from name
                  const name = carData.name || `${carData.brand || carData.make || ''} ${carData.model || ''}`.trim();
                  if (name) {
                    // Try to fetch car by name/brand/model to get real ID
                    carId = null; // Will need to search for it
                  }
                }
                
                // Convert recommendation data to Car type
                const car: Car = {
                  _id: carId || `temp_${idx}`,
                  brand: carData.brand || carData.make || carData.Make || "",
                  model: carData.model || carData.Model || "",
                  variant: carData.variant || carData.Variant || "",
                  year: carData.year || carData.Year || 2024,
                  bodyType: carData.bodyType || carData.BodyType || "",
                  segment: carData.segment || carData.Segment || "",
                  priceInLakhs: carData.price || carData.Price || carData.priceInLakhs || 0,
                  
                  // Dimensions
                  length: carData.length || 4000,
                  width: carData.width || 1700,
                  height: carData.height || 1500,
                  wheelbase: carData.wheelbase || 2500,
                  groundClearance: carData.groundClearance || 165,
                  weight: carData.weight || 1200,
                  turningRadius: carData.turningRadius || 5,
                  fuelTank: carData.fuelTank || 45,
                  
                  // Engine
                  displacement: carData.displacement || 1000,
                  cylinders: carData.cylinders || 3,
                  turboNA: (carData.turboNA || "NA") as "Turbo" | "NA",
                  powerBhp: carData.powerBhp || carData.power || 60,
                  torqueNm: carData.torqueNm || 90,
                  
                  // Transmission
                  transmissionType: (carData.transmission || carData.transmissionType || "Manual") as any,
                  gearCount: carData.gearCount || 5,
                  driveType: (carData.driveType || "FWD") as any,
                  
                  // Performance
                  acceleration0to100: carData.acceleration0to100 || 12,
                  topSpeed: carData.topSpeed || 180,
                  
                  // Fuel
                  mileageARAI: carData.mileage || carData.Mileage || carData.mileageARAI || 15,
                  emissionStandard: carData.emissionStandard || "BS6",
                  adBlueSystem: carData.adBlueSystem || false,
                  
                  // Safety
                  airbags: carData.airbags || 2,
                  abs: carData.abs !== false,
                  esc: carData.esc !== false,
                  crashTestRating: carData.crashTestRating || carData.rating || 4,
                  parkingSensors: carData.parkingSensors || false,
                  parkingCamera: carData.parkingCamera || false,
                  isofix: carData.isofix || false,
                  hillHoldControl: carData.hillHoldControl || false,
                  tractionControl: carData.tractionControl || false,
                  electronicBrakeDistribution: carData.electronicBrakeDistribution !== false,
                  
                  // Comfort
                  airConditioning: carData.airConditioning !== false,
                  ventilatedSeats: carData.ventilatedSeats || false,
                  keylessEntry: carData.keylessEntry || false,
                  cruiseControl: carData.cruiseControl || false,
                  sunroof: carData.sunroof || false,
                  heatedSeats: carData.heatedSeats || false,
                  lumbarSupport: carData.lumbarSupport || false,
                  adjustableHeadrest: carData.adjustableHeadrest !== false,
                  rearArmrest: carData.rearArmrest || false,
                  cupHolders: carData.cupHolders || 2,
                  powerWindows: carData.powerWindows !== false,
                  centralLocking: carData.centralLocking !== false,
                  
                  // Infotainment
                  touchscreenSize: carData.touchscreenSize || 7,
                  carPlayAndroidAuto: carData.carPlayAndroidAuto || false,
                  speakers: carData.speakers || 4,
                  digitalCluster: carData.digitalCluster || false,
                  connectedTech: carData.connectedTech || false,
                  wirelessCharging: carData.wirelessCharging || false,
                  usbPorts: carData.usbPorts || 2,
                  bluetoothConnectivity: carData.bluetoothConnectivity !== false,
                  
                  // Practicality
                  bootSpace: carData.bootSpace || 350,
                  foldableSeats: carData.foldableSeats !== false,
                  roofRails: carData.roofRails || false,
                  spareWheel: (carData.spareWheel || "Full") as any,
                  
                  // Exterior
                  wheelSize: carData.wheelSize || 15,
                  ledHeadlights: carData.ledHeadlights || false,
                  drl: carData.drl || false,
                  fogLamps: carData.fogLamps || false,
                  autoFoldingMirrors: carData.autoFoldingMirrors || false,
                  alloyWheels: carData.alloyWheels || false,
                  
                  // ADAS
                  adaptiveCruise: carData.adaptiveCruise || false,
                  laneKeepAssist: carData.laneKeepAssist || false,
                  collisionWarning: carData.collisionWarning || false,
                  automaticEmergencyBraking: carData.automaticEmergencyBraking || false,
                  blindSpotMonitor: carData.blindSpotMonitor || false,
                  rearCrossTrafficAlert: carData.rearCrossTrafficAlert || false,
                  driverAttentionAlert: carData.driverAttentionAlert || false,
                  
                  // Ownership
                  warranty: carData.warranty || "3 Years/1,00,000 km",
                  serviceInterval: carData.serviceInterval || 10000,
                  roadsideAssistance: carData.roadsideAssistance !== false,
                  
                  // Additional
                  images: carData.images || [],
                  rating: carData.rating || carData.crashTestRating || 4,
                  reviewCount: carData.reviewCount || 0,
                };
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <CarCard
                      car={car}
                      onViewDetails={async (id) => {
                        // If ID is temporary, try to find the real car
                        if (id.startsWith('temp_')) {
                          // Search for car by name/brand/model
                          const searchQuery = `${car.brand} ${car.model}`.trim();
                          try {
                            const response = await fetch(`/api/cars?search=${encodeURIComponent(searchQuery)}&limit=1`);
                            if (response.ok) {
                              const data = await response.json();
                              if (data.cars && data.cars.length > 0) {
                                window.location.href = `/cars/${data.cars[0]._id}`;
                                return;
                              }
                            }
                          } catch (error) {
                            console.error("Error searching for car:", error);
                          }
                          // Fallback: show error or go to explore
                          alert("Car details not available. Please search for this car on the explore page.");
                          window.location.href = `/explore?search=${encodeURIComponent(searchQuery)}`;
                        } else {
                          window.location.href = `/cars/${id}`;
                        }
                      }}
                      onCompare={(id) => console.log("Compare:", id)}
                      onToggleFavorite={(id) => console.log("Favorite:", id)}
                      onToggleWishlist={(id) => console.log("Wishlist:", id)}
                    />
                  </motion.div>
                );
              })}
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
