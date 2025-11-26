"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import ExploreSection from "@/components/features/explore-section";
import ModernSearchBar from "@/components/ui/modern-search-bar";
import { Car } from "@/types/car";

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamValue = searchParams.get("search") ?? "";
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoadingCars, setIsLoadingCars] = useState(true);

  useEffect(() => {
    const fetchCars = async () => {
      setIsLoadingCars(true);
      try {
        const searchQuery = searchParamValue
          ? `&search=${encodeURIComponent(searchParamValue)}`
          : "";
        const response = await fetch(`/api/cars?limit=12${searchQuery}`);
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
  }, [searchParamValue]);

  const handleSearch = (query: string) => {
    const nextUrl = query
      ? `/explore?search=${encodeURIComponent(query)}`
      : "/explore";
    router.push(nextUrl);
  };

  const handleViewDetails = (carId: string) => {
    router.push(`/cars/${carId}`);
  };

  const handleCompare = (carId: string) => {
    console.log("Compare car ID:", carId);
  };

  const handleToggleFavorite = (carId: string) => {
    console.log("Toggle favorite for car ID:", carId);
  };

  const handleToggleWishlist = (carId: string) => {
    console.log("Toggle wishlist for car ID:", carId);
  };

  return (
    <>
      {/* Hero Search Section */}
      <section className="relative bg-gradient-to-br from-background via-primary/5 to-accent/5 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Explore Our Collection
                </span>
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Search our{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  premium catalog
                </span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Find your perfect car from our extensive collection
              </p>
            </div>

            {/* Modern Search Bar */}
            <ModernSearchBar
              onSearch={handleSearch}
              onAISearch={handleSearch}
              placeholder="Try 'EV under 20 lakh with fast charging'"
              size="md"
            />

            {/* Current Search */}
            {searchParamValue && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-center"
              >
                <span className="text-sm text-muted-foreground">
                  Showing results for:{" "}
                  <span className="font-semibold text-foreground">
                    "{searchParamValue}"
                  </span>
                </span>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <ExploreSection
        cars={cars}
        isLoading={isLoadingCars}
        onViewDetails={handleViewDetails}
        onCompare={handleCompare}
        onToggleFavorite={handleToggleFavorite}
        onToggleWishlist={handleToggleWishlist}
      />
    </>
  );
}
