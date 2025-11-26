"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Heart,
  Bookmark,
  Star,
  Fuel,
  Users,
  Cog,
  Eye,
  GitCompare,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { Car } from "@/types/car";
import { useComparison } from "@/contexts/comparison-context";
import { useRouter } from "next/navigation";

interface CarCardProps {
  car: Car;
  onViewDetails: (carId: string) => void;
  onCompare?: (carId: string) => void;
  onToggleFavorite: (carId: string) => void;
  onToggleWishlist: (carId: string) => void;
}

export default function CarCard({
  car,
  onViewDetails,
  onCompare,
  onToggleFavorite,
  onToggleWishlist,
}: CarCardProps) {
  const router = useRouter();
  const { addToComparison, isInComparison, canAddMore } = useComparison();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);

  const handleCompare = () => {
    if (isInComparison(car._id!)) {
      // If already in comparison, navigate to comparison page
      router.push("/compare");
    } else if (canAddMore) {
      // Add to comparison
      const added = addToComparison(car);
      if (added) {
        if (onCompare) {
          onCompare(car._id!);
        }
        // Optionally navigate to comparison page after adding
        // router.push("/compare");
      }
    } else {
      // Max limit reached, navigate to comparison page
      router.push("/compare");
    }
  };

  const isCompared = isInComparison(car._id!);

  const getFuelTypeColor = (transmissionType: string) => {
    switch (transmissionType) {
      case "Manual":
        return "bg-blue-500/20 text-blue-400";
      case "Automatic":
        return "bg-purple-500/20 text-purple-400";
      case "CVT":
        return "bg-green-500/20 text-green-400";
      case "DCT":
        return "bg-orange-500/20 text-orange-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  // Get all available features
  const allFeatures = [
    { label: "Sunroof", available: car.sunroof },
    { label: "Wireless Charging", available: car.wirelessCharging },
    { label: "LED Headlights", available: car.ledHeadlights },
    { label: "Ventilated Seats", available: car.ventilatedSeats },
    { label: "Cruise Control", available: car.cruiseControl },
    { label: "Keyless Entry", available: car.keylessEntry },
    { label: "Parking Camera", available: car.parkingCamera },
    { label: "Parking Sensors", available: car.parkingSensors },
  ].filter((feature) => feature.available);

  const visibleFeatures = showMoreFeatures ? allFeatures : allFeatures.slice(0, 3);
  const hasMoreFeatures = allFeatures.length > 3;

  // Get current image URL with fallback logic
  const getCurrentImageUrl = () => {
    const validateUrl = (url: string) => {
      if (!url) return false;
      // Check if it's a relative URL (starts with /) or a valid absolute URL
      if (url.startsWith("/")) return true;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    const fallbackImages = [
      ...(Array.isArray(car.images)
        ? car.images
        : car.images
        ? [car.images]
        : []),
      "/api/placeholder/400/300",
    ].filter((url) => url && validateUrl(url));

    return fallbackImages[currentImageIndex] || "/api/placeholder/400/300";
  };

  // Handle image load error - try next fallback
  const handleImageError = () => {
    setImageError(true);
    setIsImageLoaded(false);

    const validateUrl = (url: string) => {
      if (!url) return false;
      if (url.startsWith("/")) return true;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    const fallbackImages = [
      ...(Array.isArray(car.images)
        ? car.images
        : car.images
        ? [car.images]
        : []),
      "/api/placeholder/400/300",
    ].filter((url) => url && validateUrl(url));

    if (currentImageIndex < fallbackImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setImageError(false);
    }
  };

  return (
    <motion.div
      className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group h-full flex flex-col"
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {/* Fuel Type Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getFuelTypeColor(
              car.transmissionType
            )}`}
          >
            {car.transmissionType}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 z-10 flex space-x-2">
          <motion.button
            onClick={() => onToggleFavorite(car._id!)}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 cursor-pointer ${
              car.isFavorite
                ? "bg-red-500 text-white"
                : "bg-black/20 text-white hover:bg-red-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart
              className={`w-4 h-4 ${car.isFavorite ? "fill-current" : ""}`}
            />
          </motion.button>

          <motion.button
            onClick={() => onToggleWishlist(car._id!)}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 cursor-pointer ${
              car.isInWishlist
                ? "bg-primary text-white"
                : "bg-black/20 text-white hover:bg-primary"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bookmark
              className={`w-4 h-4 ${car.isInWishlist ? "fill-current" : ""}`}
            />
          </motion.button>
        </div>

        {/* Car Image */}
        <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center relative">
          {!isImageLoaded && !imageError && (
            <div className="text-muted-foreground text-sm animate-pulse">
              Loading image...
            </div>
          )}
          {imageError && currentImageIndex === 1 && (
            <div className="text-muted-foreground text-sm text-center p-4">
              <div className="text-2xl mb-2">🚗</div>
              <div>Image not available</div>
            </div>
          )}
          <Image
            src={getCurrentImageUrl()}
            alt={`${car.brand} ${car.model}`}
            fill
            priority={false}
            loading="lazy"
            className={`object-cover transition-all duration-500 group-hover:scale-110 ${
              isImageLoaded && !imageError ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => {
              setIsImageLoaded(true);
              setImageError(false);
            }}
            onError={handleImageError}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-base font-bold text-foreground mb-1 line-clamp-1">
            {car.brand && car.model ? `${car.brand} ${car.model}` : car.variant || "Car"}
          </h3>
          {car.variant && (
            <p className="text-muted-foreground text-xs line-clamp-1">{car.variant}</p>
          )}
        </div>

        {/* Price and Rating */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-primary">
              ₹{car.priceInLakhs.toFixed(2)}L
            </span>
            <p className="text-xs text-muted-foreground">Ex-showroom</p>
          </div>

          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-xs font-medium">{car.rating?.toFixed(1) || "4.0"}</span>
            <span className="text-xs text-muted-foreground">
              ({car.reviewCount || 0})
            </span>
          </div>
        </div>

        {/* Specifications */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="flex flex-col items-center space-y-0.5">
            <Fuel className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {car.mileageARAI?.toFixed(1) || "0"} kmpl
            </span>
          </div>

          <div className="flex flex-col items-center space-y-0.5">
            <Cog className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {car.transmissionType || "Manual"}
            </span>
          </div>

          <div className="flex flex-col items-center space-y-0.5">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">5 Seater</span>
          </div>
        </div>

        {/* Features */}
        <div className="mb-3 flex-1">
          <div className="flex flex-wrap gap-1">
            {visibleFeatures.map((feature, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground"
              >
                {feature.label}
              </span>
            ))}
            {hasMoreFeatures && (
              <motion.button
                onClick={() => setShowMoreFeatures(!showMoreFeatures)}
                className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium hover:bg-primary/20 transition-colors flex items-center gap-1 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showMoreFeatures ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Show Less
                  </>
                ) : (
                  <>
                    +{allFeatures.length - 3} more
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <motion.button
            onClick={() => {
              if (car._id) {
                onViewDetails(car._id);
              } else {
                console.error("Car ID is missing:", car);
              }
            }}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-1.5 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
          </motion.button>

          <motion.button
            onClick={handleCompare}
            className={`py-1.5 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center cursor-pointer ${
              isCompared
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={isCompared ? "View Comparison" : "Add to Comparison"}
          >
            {isCompared ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <GitCompare className="w-3.5 h-3.5" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
