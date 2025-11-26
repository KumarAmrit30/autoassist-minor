"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExploreSection from "@/components/features/explore-section";
import { Car } from "@/types/car";

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamValue = searchParams.get("search") ?? "";
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoadingCars, setIsLoadingCars] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParamValue);

  useEffect(() => {
    setSearchInput(searchParamValue);
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

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchInput.trim();
    const nextUrl = trimmed ? `/explore?search=${encodeURIComponent(trimmed)}` : "/explore";
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
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 mt-4">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm font-medium text-primary mb-2">
                Start exploring
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold">
                Search our{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  premium catalog
                </span>
              </h1>
            </div>
            <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row">
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Try 'EV under 20 lakh with fast charging'"
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

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

