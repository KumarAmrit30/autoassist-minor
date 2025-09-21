"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/ui/loading-screen";
import AuthModal from "@/components/ui/auth-modal";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import HeroSection from "@/components/features/hero-section";
import ExploreSection from "@/components/features/explore-section";
import FeaturesSection from "@/components/features/features-section";
import AboutSection from "@/components/features/about-section";
import ContactSection from "@/components/features/contact-section";
import { Car } from "@/types/car";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [cars, setCars] = useState<Car[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoadingCars, setIsLoadingCars] = useState(false);

  useEffect(() => {
    // Check if user has visited before in this session
    const hasVisited = sessionStorage.getItem("hasVisited");
    if (hasVisited) {
      setIsLoading(false);
    }
  }, []);

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
          console.error("Failed to fetch cars from API");
          setCars([]);
        }
      } catch (error) {
        console.error("Error fetching cars:", error);
        setCars([]);
      } finally {
        setIsLoadingCars(false);
      }
    };

    if (!isLoading) {
      fetchCars();
    }
  }, [isLoading]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    sessionStorage.setItem("hasVisited", "true");
  };

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

  const handleFilterClick = () => {
    console.log("Filter clicked");
    // TODO: Implement filter modal
  };

  const handleViewDetails = (carId: string) => {
    console.log("View details for car:", carId);
    // TODO: Navigate to car details page
  };

  const handleCompare = (carId: string) => {
    console.log("Compare car:", carId);
    // TODO: Implement comparison functionality
  };

  const handleToggleFavorite = (carId: string) => {
    setCars((prevCars) =>
      prevCars.map((car) =>
        car._id === carId ? { ...car, isFavorite: !car.isFavorite } : car
      )
    );
  };

  const handleToggleWishlist = (carId: string) => {
    setCars((prevCars) =>
      prevCars.map((car) =>
        car._id === carId ? { ...car, isInWishlist: !car.isInWishlist } : car
      )
    );
  };

  const handleSignInClick = () => {
    setShowAuthModal(true);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen onLoadingComplete={handleLoadingComplete} />
        )}
      </AnimatePresence>

      {!isLoading && (
        <div className="min-h-screen bg-background">
          <Header onSignInClick={handleSignInClick} />

          <main>
            <HeroSection
              onSearch={handleSearch}
              onFilterClick={handleFilterClick}
            />

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
        </div>
      )}
    </>
  );
}
