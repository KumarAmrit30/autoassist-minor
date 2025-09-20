"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Car } from "@/types/car";
import CarCard from "./car-card";

interface ExploreSectionProps {
  cars: Car[];
  isLoading?: boolean;
  onViewDetails: (carId: string) => void;
  onCompare: (carId: string) => void;
  onToggleFavorite: (carId: string) => void;
  onToggleWishlist: (carId: string) => void;
}

export default function ExploreSection({
  cars,
  isLoading = false,
  onViewDetails,
  onCompare,
  onToggleFavorite,
  onToggleWishlist,
}: ExploreSectionProps) {
  const [displayedCars, setDisplayedCars] = useState(4);

  const loadMoreCars = () => {
    setDisplayedCars((prev) => Math.min(prev + 4, cars.length));
  };

  return (
    <section id="explore" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Explore Our{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Car Collection
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the perfect car for your needs from our extensive
            collection of premium vehicles
          </p>
        </motion.div>

        {/* Car Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {isLoading
            ? // Loading skeletons
              Array.from({ length: 8 }).map((_, index) => (
                <motion.div
                  key={index}
                  className="bg-card border border-border rounded-xl overflow-hidden h-[400px]"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="animate-pulse">
                    <div className="aspect-[4/3] bg-muted"></div>
                    <div className="p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="h-8 bg-muted rounded w-1/3"></div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded"></div>
                      </div>
                      <div className="h-10 bg-muted rounded"></div>
                    </div>
                  </div>
                </motion.div>
              ))
            : cars.slice(0, displayedCars).map((car, index) => (
                <motion.div
                  key={car._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <CarCard
                    car={car}
                    onViewDetails={onViewDetails}
                    onCompare={onCompare}
                    onToggleFavorite={onToggleFavorite}
                    onToggleWishlist={onToggleWishlist}
                  />
                </motion.div>
              ))}
        </div>

        {/* Load More Button */}
        {displayedCars < cars.length && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.button
              onClick={loadMoreCars}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-medium transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Load More Cars ({cars.length - displayedCars} remaining)
            </motion.button>
          </motion.div>
        )}

        {/* No Results */}
        {cars.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-2xl font-bold mb-2">No cars found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or browse all available cars
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
