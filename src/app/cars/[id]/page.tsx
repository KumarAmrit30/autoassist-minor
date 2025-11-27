"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Heart,
  Bookmark,
  GitCompare,
  Share2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Fuel,
  Gauge,
  Calendar,
  Users,
  Shield,
  Zap,
  Settings,
  Home,
  ChevronRight as BreadcrumbArrow,
  Star,
  Clock,
  Wrench,
} from "lucide-react";
import { Car } from "@/types/car";
import { useComparison } from "@/contexts/comparison-context";
import CarCard from "@/components/features/car-card";

type TabType = "overview" | "performance" | "safety" | "comfort" | "technology";

export default function CarDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const carId = params.id as string;
  const { addToComparison, isInComparison, canAddMore } = useComparison();

  const [car, setCar] = useState<Car | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [relatedCars, setRelatedCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  const handleCompare = () => {
    if (!car) return;
    
    if (isInComparison(car._id!)) {
      // If already in comparison, navigate to comparison page
      router.push("/compare");
    } else if (canAddMore) {
      // Add to comparison
      addToComparison(car);
      // Optionally navigate to comparison page after adding
      // router.push("/compare");
    } else {
      // Max limit reached, navigate to comparison page
      router.push("/compare");
    }
  };

  // Handler to switch variants
  const handleVariantChange = async (variantId: string) => {
    if (variantId === car?._id) return; // Already viewing this variant
    
    setIsLoading(true);
    router.push(`/cars/${variantId}`);
  };

  useEffect(() => {
    const fetchCarDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/cars/${carId}`);
        if (response.ok) {
          const data = await response.json();
          setCar(data.car);
          setSelectedVariantId(data.car._id);
          
          // Fetch related cars using grouped API to avoid showing variants
          const relatedResponse = await fetch(
            `/api/cars/grouped?brand=${data.car.brand}&limit=4`
          );
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            // Filter out current car model
            const filtered = relatedData.cars.filter(
              (c: Car) => c.model !== data.car.model
            );
            setRelatedCars(filtered.slice(0, 3));
          }
        } else {
          console.error("Failed to fetch car details");
        }
      } catch (error) {
        console.error("Error fetching car details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarDetails();
  }, [carId, router]);

  const getImages = () => {
    if (!car) return ["/api/placeholder/800/600"];
    const images = Array.isArray(car.images) ? car.images : [];
    return images.length > 0 ? images : ["/api/placeholder/800/600"];
  };

  const nextImage = () => {
    const images = getImages();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = getImages();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleShare = async () => {
    if (navigator.share && car) {
      try {
        await navigator.share({
          title: `${car.brand} ${car.model}`,
          text: `Check out this ${car.brand} ${car.model} - ₹${car.priceInLakhs} Lakh`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share failed:", error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading car details...</p>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Car not found</h1>
          <button
            onClick={() => router.push("/explore")}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 cursor-pointer"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  const images = getImages();

  return (
    <div className="min-h-screen pb-20">
      {/* Breadcrumb Navigation */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.push("/")}
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center cursor-pointer"
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </button>
            <BreadcrumbArrow className="w-4 h-4 text-muted-foreground" />
            <button
              onClick={() => router.push("/explore")}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Explore
            </button>
            <BreadcrumbArrow className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">
              {car.brand} {car.model}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-muted rounded-2xl overflow-hidden group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={images[currentImageIndex]}
                    alt={`${car.brand} ${car.model}`}
                    fill
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      currentImageIndex === index
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Car Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    {car.brand} {car.model}
                  </h1>
                  <p className="text-xl text-muted-foreground">{car.variant}</p>
                </div>
                <div className="flex items-center space-x-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="font-semibold text-yellow-500">
                    {car.rating?.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({car.reviewCount})
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                  {car.bodyType}
                </span>
                <span className="px-3 py-1 bg-secondary/20 text-secondary-foreground rounded-full text-sm font-medium">
                  {car.segment}
                </span>
                <span className="px-3 py-1 bg-accent/20 text-accent-foreground rounded-full text-sm font-medium">
                  {car.year}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-6 border border-primary/20">
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-4xl font-bold text-primary">
                  ₹{car.priceInLakhs.toFixed(2)}
                </span>
                <span className="text-xl text-muted-foreground">Lakh</span>
              </div>
              <p className="text-sm text-muted-foreground">Ex-showroom price</p>
            </div>

            {/* Variant Selector */}
            {car.variants && car.variants.length > 1 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Available Variants ({car.variants.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {car.variants.map((variant) => (
                    <motion.button
                      key={variant._id}
                      onClick={() => handleVariantChange(variant._id)}
                      disabled={variant._id === selectedVariantId}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        variant._id === selectedVariantId
                          ? "border-primary bg-primary/10 cursor-default"
                          : "border-border hover:border-primary/50 hover:bg-muted cursor-pointer"
                      }`}
                      whileHover={variant._id !== selectedVariantId ? { scale: 1.02 } : {}}
                      whileTap={variant._id !== selectedVariantId ? { scale: 0.98 } : {}}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm flex items-center gap-2">
                            {variant.name}
                            {variant._id === selectedVariantId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary text-primary-foreground">
                                <Check className="w-3 h-3 mr-1" />
                                Current
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{variant.transmission}</span>
                            <span>•</span>
                            <span>{variant.fuelType}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            ₹{variant.price.toFixed(2)}L
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Key Specs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                  <Fuel className="w-5 h-5" />
                  <span className="text-sm">Mileage</span>
                </div>
                <p className="text-2xl font-bold">{car.mileageARAI} kmpl</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                  <Gauge className="w-5 h-5" />
                  <span className="text-sm">Engine</span>
                </div>
                <p className="text-2xl font-bold">{car.displacement} cc</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Transmission</span>
                </div>
                <p className="text-lg font-bold">{car.transmissionType}</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">Seating</span>
                </div>
                <p className="text-2xl font-bold">5 Seater</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all cursor-pointer ${
                  isFavorite
                    ? "bg-red-500 text-white"
                    : "bg-card border border-border hover:bg-muted"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                />
                <span>{isFavorite ? "Favorited" : "Add to Favorites"}</span>
              </motion.button>

              <motion.button
                onClick={() => setIsInWishlist(!isInWishlist)}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all cursor-pointer ${
                  isInWishlist
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-muted"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Bookmark
                  className={`w-5 h-5 ${isInWishlist ? "fill-current" : ""}`}
                />
                <span>{isInWishlist ? "In Wishlist" : "Add to Wishlist"}</span>
              </motion.button>

              <motion.button
                onClick={handleCompare}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all cursor-pointer ${
                  isInComparison(car._id!)
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-muted"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <GitCompare className="w-5 h-5" />
                <span>{isInComparison(car._id!) ? "In Comparison" : "Compare"}</span>
              </motion.button>

              <motion.button
                onClick={handleShare}
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium bg-card border border-border hover:bg-muted transition-all cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Specifications Tabs */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Tab Headers */}
          <div className="flex overflow-x-auto border-b border-border">
            {[
              { id: "overview", label: "Overview", icon: Home },
              { id: "performance", label: "Performance", icon: Zap },
              { id: "safety", label: "Safety", icon: Shield },
              { id: "comfort", label: "Comfort & Features", icon: Star },
              { id: "technology", label: "Technology", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                    activeTab === tab.id
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "overview" && <OverviewTab car={car} />}
                {activeTab === "performance" && <PerformanceTab car={car} />}
                {activeTab === "safety" && <SafetyTab car={car} />}
                {activeTab === "comfort" && <ComfortTab car={car} />}
                {activeTab === "technology" && <TechnologyTab car={car} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Related Cars */}
        {relatedCars.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Similar Cars You Might Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedCars.map((relatedCar) => (
                <CarCard
                  key={relatedCar._id}
                  car={relatedCar}
                  onViewDetails={(id) => router.push(`/cars/${id}`)}
                  onToggleFavorite={(id) => console.log("Favorite:", id)}
                  onToggleWishlist={(id) => console.log("Wishlist:", id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Tab Components
function OverviewTab({ car }: { car: Car }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SpecItem label="Brand" value={car.brand} />
        <SpecItem label="Model" value={car.model} />
        <SpecItem label="Variant" value={car.variant} />
        <SpecItem label="Year" value={car.year.toString()} />
        <SpecItem label="Body Type" value={car.bodyType} />
        <SpecItem label="Segment" value={car.segment} />
        <SpecItem label="Price" value={`₹${car.priceInLakhs} Lakh`} />
        <SpecItem label="Emission Standard" value={car.emissionStandard} />
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4">Dimensions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SpecItem label="Length" value={`${car.length} mm`} />
          <SpecItem label="Width" value={`${car.width} mm`} />
          <SpecItem label="Height" value={`${car.height} mm`} />
          <SpecItem label="Wheelbase" value={`${car.wheelbase} mm`} />
          <SpecItem
            label="Ground Clearance"
            value={`${car.groundClearance} mm`}
          />
          <SpecItem label="Weight" value={`${car.weight} kg`} />
          <SpecItem label="Turning Radius" value={`${car.turningRadius} m`} />
          <SpecItem label="Fuel Tank" value={`${car.fuelTank} L`} />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4">Ownership</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3 bg-muted/50 p-4 rounded-lg">
            <Shield className="w-5 h-5 text-primary mt-1" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Warranty</p>
              <p className="font-medium">{car.warranty}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 bg-muted/50 p-4 rounded-lg">
            <Wrench className="w-5 h-5 text-primary mt-1" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Service Interval</p>
              <p className="font-medium">{car.serviceInterval} km</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 bg-muted/50 p-4 rounded-lg">
            <Clock className="w-5 h-5 text-primary mt-1" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Roadside Assistance
              </p>
              <p className="font-medium">
                {car.roadsideAssistance ? "Available" : "Not Available"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerformanceTab({ car }: { car: Car }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          label="Engine Displacement"
          value={`${car.displacement} cc`}
          icon={Gauge}
        />
        <StatCard
          label="Power"
          value={`${car.powerBhp} bhp`}
          icon={Zap}
        />
        <StatCard
          label="Torque"
          value={`${car.torqueNm} Nm`}
          icon={Settings}
        />
        <StatCard
          label="0-100 km/h"
          value={`${car.acceleration0to100} sec`}
          icon={Zap}
        />
        <StatCard
          label="Top Speed"
          value={`${car.topSpeed} km/h`}
          icon={Gauge}
        />
        <StatCard
          label="Mileage (ARAI)"
          value={`${car.mileageARAI} kmpl`}
          icon={Fuel}
        />
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4">Engine Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SpecItem label="Cylinders" value={car.cylinders.toString()} />
          <SpecItem label="Aspiration" value={car.turboNA} />
          <SpecItem label="AdBlue System" value={car.adBlueSystem ? "Yes" : "No"} />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4">Transmission</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SpecItem label="Type" value={car.transmissionType} />
          <SpecItem label="Gears" value={`${car.gearCount} Speed`} />
          <SpecItem label="Drive Type" value={car.driveType} />
        </div>
      </div>
    </div>
  );
}

function SafetyTab({ car }: { car: Car }) {
  const safetyFeatures = [
    { name: "ABS", available: car.abs },
    { name: "ESC", available: car.esc },
    { name: "Parking Sensors", available: car.parkingSensors },
    { name: "Parking Camera", available: car.parkingCamera },
    { name: "ISOFIX", available: car.isofix },
    { name: "Hill Hold Control", available: car.hillHoldControl },
    { name: "Traction Control", available: car.tractionControl },
    { name: "EBD", available: car.electronicBrakeDistribution },
  ];

  const adasFeatures = [
    { name: "Adaptive Cruise Control", available: car.adaptiveCruise },
    { name: "Lane Keep Assist", available: car.laneKeepAssist },
    { name: "Collision Warning", available: car.collisionWarning },
    { name: "Automatic Emergency Braking", available: car.automaticEmergencyBraking },
    { name: "Blind Spot Monitor", available: car.blindSpotMonitor },
    { name: "Rear Cross Traffic Alert", available: car.rearCrossTrafficAlert },
    { name: "Driver Attention Alert", available: car.driverAttentionAlert },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Crash Test Rating</p>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < car.crashTestRating
                        ? "text-yellow-500 fill-current"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-secondary/10 to-accent/10 rounded-xl p-6 border border-secondary/20">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-secondary" />
            <div>
              <p className="text-sm text-muted-foreground">Airbags</p>
              <p className="text-3xl font-bold">{car.airbags}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4">Safety Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {safetyFeatures.map((feature) => (
            <FeatureItem
              key={feature.name}
              name={feature.name}
              available={feature.available}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4">ADAS Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {adasFeatures.map((feature) => (
            <FeatureItem
              key={feature.name}
              name={feature.name}
              available={feature.available}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ComfortTab({ car }: { car: Car }) {
  const comfortFeatures = [
    { name: "Air Conditioning", available: car.airConditioning },
    { name: "Ventilated Seats", available: car.ventilatedSeats },
    { name: "Keyless Entry", available: car.keylessEntry },
    { name: "Cruise Control", available: car.cruiseControl },
    { name: "Sunroof", available: car.sunroof },
    { name: "Heated Seats", available: car.heatedSeats },
    { name: "Lumbar Support", available: car.lumbarSupport },
    { name: "Adjustable Headrest", available: car.adjustableHeadrest },
    { name: "Rear Armrest", available: car.rearArmrest },
    { name: "Power Windows", available: car.powerWindows },
    { name: "Central Locking", available: car.centralLocking },
    { name: "Foldable Seats", available: car.foldableSeats },
    { name: "Roof Rails", available: car.roofRails },
  ];

  const exteriorFeatures = [
    { name: "LED Headlights", available: car.ledHeadlights },
    { name: "LED DRLs", available: car.drl },
    { name: "Fog Lamps", available: car.fogLamps },
    { name: "Auto-Folding Mirrors", available: car.autoFoldingMirrors },
    { name: "Alloy Wheels", available: car.alloyWheels },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Boot Space"
          value={`${car.bootSpace} L`}
          icon={Home}
        />
        <StatCard
          label="Cup Holders"
          value={car.cupHolders.toString()}
          icon={Star}
        />
        <StatCard
          label="Wheel Size"
          value={`${car.wheelSize}"`}
          icon={Settings}
        />
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4">Comfort Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {comfortFeatures.map((feature) => (
            <FeatureItem
              key={feature.name}
              name={feature.name}
              available={feature.available}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4">Exterior Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exteriorFeatures.map((feature) => (
            <FeatureItem
              key={feature.name}
              name={feature.name}
              available={feature.available}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4">Practicality</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SpecItem label="Spare Wheel" value={car.spareWheel} />
        </div>
      </div>
    </div>
  );
}

function TechnologyTab({ car }: { car: Car }) {
  const techFeatures = [
    { name: "Apple CarPlay / Android Auto", available: car.carPlayAndroidAuto },
    { name: "Digital Instrument Cluster", available: car.digitalCluster },
    { name: "Connected Tech", available: car.connectedTech },
    { name: "Wireless Charging", available: car.wirelessCharging },
    { name: "Bluetooth Connectivity", available: car.bluetoothConnectivity },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Touchscreen Size"
          value={`${car.touchscreenSize}"`}
          icon={Settings}
        />
        <StatCard
          label="Speakers"
          value={car.speakers.toString()}
          icon={Star}
        />
        <StatCard
          label="USB Ports"
          value={car.usbPorts.toString()}
          icon={Zap}
        />
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4">Infotainment & Technology</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {techFeatures.map((feature) => (
            <FeatureItem
              key={feature.name}
              name={feature.name}
              available={feature.available}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center space-x-2 text-muted-foreground mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function FeatureItem({
  name,
  available,
}: {
  name: string;
  available: boolean;
}) {
  return (
    <div
      className={`flex items-center space-x-3 p-3 rounded-lg ${
        available ? "bg-green-500/10" : "bg-muted/50"
      }`}
    >
      {available ? (
        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      )}
      <span
        className={available ? "text-foreground" : "text-muted-foreground"}
      >
        {name}
      </span>
    </div>
  );
}

