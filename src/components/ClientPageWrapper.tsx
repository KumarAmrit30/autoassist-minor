"use client";

import { useState, useEffect, Suspense, ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/ui/loading-screen";
import AuthModal from "@/components/ui/auth-modal";
import WelcomeModal from "@/components/ui/welcome-modal";
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
