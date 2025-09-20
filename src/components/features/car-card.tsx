"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Car } from "@/types/car";

interface CarCardProps {
  car: Car;
  onViewDetails: (carId: string) => void;
  onCompare: (carId: string) => void;
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
  const [isImageLoaded, setIsImageLoaded] = useState(false);

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

  const features = [
    { label: "Sunroof", available: car.sunroof },
    { label: "Wireless Charging", available: car.wirelessCharging },
    { label: "LED Headlights", available: car.ledHeadlights },
    { label: "+2 more", available: true },
  ].filter((feature) => feature.available);

  return (
    <motion.div
      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group h-full flex flex-col"
      whileHover={{ y: -5 }}
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
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
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
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
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
        <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
          {!isImageLoaded && (
            <div className="text-muted-foreground text-sm">
              Loading image...
            </div>
          )}
          <Image
            src={car.images?.[0] || "/api/placeholder/400/300"}
            alt={`${car.brand} ${car.model}`}
            fill
            className={`object-cover transition-all duration-500 group-hover:scale-110 ${
              isImageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsImageLoaded(true)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-foreground mb-1">
            {car.brand} {car.model}
          </h3>
          <p className="text-muted-foreground text-sm">{car.variant}</p>
        </div>

        {/* Price and Rating */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-primary">
              ₹{car.priceInLakhs.toFixed(2)} Lakh
            </span>
            <p className="text-xs text-muted-foreground">Ex-showroom</p>
          </div>

          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium">{car.rating}</span>
            <span className="text-xs text-muted-foreground">
              ({car.reviewCount})
            </span>
          </div>
        </div>

        {/* Specifications */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div className="flex flex-col items-center space-y-1">
            <Fuel className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {car.mileageARAI} kmpl
            </span>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <Cog className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {car.transmissionType}
            </span>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">5 Seater</span>
          </div>
        </div>

        {/* Features */}
        <div className="mb-6 flex-1">
          <div className="flex flex-wrap gap-1">
            {features.slice(0, 4).map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground"
              >
                {feature.label}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <motion.button
            onClick={() => onViewDetails(car._id!)}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </motion.button>

          <motion.button
            onClick={() => onCompare(car._id!)}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <GitCompare className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
