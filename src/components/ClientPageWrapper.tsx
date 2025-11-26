"use client";

import { useState, useEffect, Suspense, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Sparkles } from "lucide-react";
import LoadingScreen from "@/components/ui/loading-screen";
import AuthModal from "@/components/ui/auth-modal";
import WelcomeModal from "@/components/ui/welcome-modal";
import AIChatInterface from "@/components/features/ai-chat-interface";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useAuth } from "@/contexts/auth-context";
import { useUserPreferences } from "@/hooks/useLocalStorage";
import { useSearchParams } from "next/navigation";

interface ClientPageWrapperProps {
  children: ReactNode;
}

function MarketingShell({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [preferences] = useUserPreferences();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("hasVisited");
    if (hasVisited) {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const welcomeParam = searchParams.get("welcome");

    if (
      isAuthenticated &&
      user &&
      (welcomeParam === "true" || !preferences.hasSeenWelcomeMessage)
    ) {
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
      }, 500);

      if (welcomeParam === "true") {
        const newPath =
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.hash}`
            : "/";
        window.history.replaceState({}, "", newPath);
      }

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, preferences.hasSeenWelcomeMessage, searchParams]);

  // Listen for custom event to open AI chat with query
  useEffect(() => {
    const handleOpenAIChat = (event: CustomEvent) => {
      setInitialQuery(event.detail?.query || "");
      setShowAIChat(true);
    };

    window.addEventListener("openAIChat", handleOpenAIChat as EventListener);
    return () => {
      window.removeEventListener("openAIChat", handleOpenAIChat as EventListener);
    };
  }, []);

  const handleFinishLoading = () => {
    sessionStorage.setItem("hasVisited", "true");
    setIsLoading(false);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen onLoadingComplete={handleFinishLoading} />}
      </AnimatePresence>

      {!isLoading && (
        <div className="min-h-screen bg-background">
          <Header onSignInClick={() => setShowAuthModal(true)} />

          <main className="pt-20 lg:pt-24 pb-16">{children}</main>

          <Footer />

          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />

          <WelcomeModal
            isOpen={showWelcomeModal}
            onClose={() => setShowWelcomeModal(false)}
          />

          {/* Global AI Chat Button - Fixed Bottom Right */}
          {!showAIChat && (
            <motion.button
              onClick={() => {
                setInitialQuery("");
                setShowAIChat(true);
              }}
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

          {/* Global AI Chat Interface */}
          {showAIChat && (
            <AIChatInterface
              initialQuery={initialQuery}
              onClose={() => {
                setShowAIChat(false);
                setInitialQuery("");
              }}
            />
          )}
        </div>
      )}
    </>
  );
}

export default function ClientPageWrapper({
  children,
}: ClientPageWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }
    >
      <MarketingShell>{children}</MarketingShell>
    </Suspense>
  );
}
