"use client";

import { useState, useEffect, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/ui/loading-screen";
import AuthModal from "@/components/ui/auth-modal";
import WelcomeModal from "@/components/ui/welcome-modal";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import HeroSection from "@/components/features/hero-section";
import ExploreSection from "@/components/features/explore-section";
import FeaturesSection from "@/components/features/features-section";
import AboutSection from "@/components/features/about-section";
import ContactSection from "@/components/features/contact-section";
import { Car } from "@/types/car";
import { useAuth } from "@/contexts/auth-context";
import { useUserPreferences } from "@/hooks/useLocalStorage";
import { useSearchParams } from "next/navigation";

function HomeContent() {
  const { user, isAuthenticated } = useAuth();
  const [preferences] = useUserPreferences();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [cars, setCars] = useState<Car[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isLoadingCars, setIsLoadingCars] = useState(false);

  useEffect(() => {
    // Check if user has visited before in this session
    const hasVisited = sessionStorage.getItem("hasVisited");
    if (hasVisited) {
      setIsLoading(false);
    }
  }, []);

  // Show welcome modal for new authenticated users
  useEffect(() => {
    const welcomeParam = searchParams.get("welcome");

    if (
      isAuthenticated &&
      user &&
      (welcomeParam === "true" || !preferences.hasSeenWelcomeMessage)
    ) {
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
      }, 500); // Show after 0.5 second delay for new signups

      // Clean up URL parameter
      if (welcomeParam === "true") {
        window.history.replaceState({}, "", "/");
      }

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, preferences.hasSeenWelcomeMessage, searchParams]);

  // Fetch cars from API
  useEffect(() => {
    const fetchCars = async () => {
      setIsLoadingCars(true);
      try {
        const response = await fetch("/api/cars?limit=8");
        if (response.ok) {
          const data = await response.json();
          setCars(data.cars);
        } else {
          console.error("Failed to fetch cars");
          setCars([]);
        }
      } catch (error) {
        console.error("Error fetching cars:", error);
        setCars([]);
      } finally {
        setIsLoadingCars(false);
      }
    };

    fetchCars();
  }, []);

  const handleSearch = async (query: string) => {
    setIsLoadingCars(true);
    try {
      const response = await fetch(
        `/api/cars?search=${encodeURIComponent(query)}&limit=8`
      );
      if (response.ok) {
        const data = await response.json();
        setCars(data.cars);
      } else {
        console.error("Failed to search cars");
        setCars([]);
      }
    } catch (error) {
      console.error("Error searching cars:", error);
      setCars([]);
    } finally {
      setIsLoadingCars(false);
    }
  };

  const handleViewDetails = (carId: string) => {
    console.log("View details for car ID:", carId);
    // TODO: Implement car details view
  };

  const handleCompare = (carId: string) => {
    console.log("Compare car ID:", carId);
    // TODO: Implement car comparison
  };

  const handleToggleFavorite = (carId: string) => {
    console.log("Toggle favorite for car ID:", carId);
    // TODO: Implement favorites toggle
  };

  const handleToggleWishlist = (carId: string) => {
    console.log("Toggle wishlist for car ID:", carId);
    // TODO: Implement wishlist toggle
  };

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

          <main>
            <HeroSection onSearch={handleSearch} onFilterClick={() => {}} />

            <ExploreSection
              cars={cars}
              isLoading={isLoadingCars}
              onViewDetails={handleViewDetails}
              onCompare={handleCompare}
              onToggleFavorite={handleToggleFavorite}
              onToggleWishlist={handleToggleWishlist}
            />

            <FeaturesSection />

            <AboutSection />

            <ContactSection />
          </main>

          <Footer />

          {/* Auth Modal */}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />

          {/* Welcome Modal */}
          <WelcomeModal
            isOpen={showWelcomeModal}
            onClose={() => setShowWelcomeModal(false)}
          />
        </div>
      )}
    </>
  );
}

export default function ClientPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
