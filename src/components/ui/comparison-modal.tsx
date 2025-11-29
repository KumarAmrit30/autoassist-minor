"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, GitCompare, Check, X as XIcon } from "lucide-react";
import { Car } from "@/types/car";
import Image from "next/image";
import { useComparison } from "@/contexts/comparison-context";

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ComparisonModal({
  isOpen,
  onClose,
}: ComparisonModalProps) {
  const { comparisonCars, removeFromComparison, clearComparison } =
    useComparison();

  if (!isOpen || comparisonCars.length === 0) return null;

  // Get all comparison features organized by category
  const getComparisonData = () => {
    const categories = [
      {
        name: "Basic Information",
        fields: [
          { label: "Brand", key: "brand" },
          { label: "Model", key: "model" },
          { label: "Variant", key: "variant" },
          { label: "Year", key: "year" },
          { label: "Body Type", key: "bodyType" },
          { label: "Segment", key: "segment" },
          { label: "Price", key: "priceInLakhs", format: (v: number) => `₹${v.toFixed(2)}L` },
        ],
      },
      {
        name: "Performance",
        fields: [
          { label: "Engine Displacement", key: "displacement", format: (v: number) => `${v} cc` },
          { label: "Power", key: "powerBhp", format: (v: number) => `${v} bhp` },
          { label: "Torque", key: "torqueNm", format: (v: number) => `${v} Nm` },
          { label: "0-100 km/h", key: "acceleration0to100", format: (v: number) => `${v} sec` },
          { label: "Top Speed", key: "topSpeed", format: (v: number) => `${v} km/h` },
          { label: "Mileage (ARAI)", key: "mileageARAI", format: (v: number) => `${v} kmpl` },
          { label: "Transmission", key: "transmissionType" },
          { label: "Drive Type", key: "driveType" },
        ],
      },
      {
        name: "Dimensions",
        fields: [
          { label: "Length", key: "length", format: (v: number) => `${v} mm` },
          { label: "Width", key: "width", format: (v: number) => `${v} mm` },
          { label: "Height", key: "height", format: (v: number) => `${v} mm` },
          { label: "Wheelbase", key: "wheelbase", format: (v: number) => `${v} mm` },
          { label: "Ground Clearance", key: "groundClearance", format: (v: number) => `${v} mm` },
          { label: "Weight", key: "weight", format: (v: number) => `${v} kg` },
          { label: "Boot Space", key: "bootSpace", format: (v: number) => `${v} L` },
        ],
      },
      {
        name: "Safety",
        fields: [
          { label: "Airbags", key: "airbags", format: (v: number) => `${v}` },
          { label: "Crash Test Rating", key: "crashTestRating", format: (v: number) => `${v}/5` },
          { label: "ABS", key: "abs", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "ESC", key: "esc", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Parking Sensors", key: "parkingSensors", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Parking Camera", key: "parkingCamera", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "ISOFIX", key: "isofix", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Traction Control", key: "tractionControl", format: (v: boolean) => (v ? "Yes" : "No") },
        ],
      },
      {
        name: "Comfort & Features",
        fields: [
          { label: "Sunroof", key: "sunroof", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Ventilated Seats", key: "ventilatedSeats", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Heated Seats", key: "heatedSeats", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Keyless Entry", key: "keylessEntry", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Cruise Control", key: "cruiseControl", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Air Conditioning", key: "airConditioning", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Cup Holders", key: "cupHolders", format: (v: number) => `${v}` },
        ],
      },
      {
        name: "Technology",
        fields: [
          { label: "Touchscreen Size", key: "touchscreenSize", format: (v: number) => `${v}"` },
          { label: "CarPlay/Android Auto", key: "carPlayAndroidAuto", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Digital Cluster", key: "digitalCluster", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Wireless Charging", key: "wirelessCharging", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Speakers", key: "speakers", format: (v: number) => `${v}` },
          { label: "USB Ports", key: "usbPorts", format: (v: number) => `${v}` },
        ],
      },
      {
        name: "Exterior",
        fields: [
          { label: "LED Headlights", key: "ledHeadlights", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "DRL", key: "drl", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Fog Lamps", key: "fogLamps", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Alloy Wheels", key: "alloyWheels", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Wheel Size", key: "wheelSize", format: (v: number) => `${v}"` },
        ],
      },
      {
        name: "ADAS",
        fields: [
          { label: "Adaptive Cruise", key: "adaptiveCruise", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Lane Keep Assist", key: "laneKeepAssist", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Collision Warning", key: "collisionWarning", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "AEB", key: "automaticEmergencyBraking", format: (v: boolean) => (v ? "Yes" : "No") },
          { label: "Blind Spot Monitor", key: "blindSpotMonitor", format: (v: boolean) => (v ? "Yes" : "No") },
        ],
      },
    ];

    return categories;
  };

  const getCarImage = (car: Car) => {
    if (car.images && Array.isArray(car.images) && car.images.length > 0) {
      return car.images[0];
    }
    return "/api/placeholder/400/300";
  };

  const getValue = (car: Car, field: { key: string; format?: (v: unknown) => string }) => {
    const value = (car as Record<string, unknown>)[field.key];
    if (value === undefined || value === null) return "N/A";
    if (field.format) {
      return field.format(value);
    }
    return value.toString();
  };

  const categories = getComparisonData();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
              <div className="flex items-center space-x-3">
                <GitCompare className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Compare Cars</h2>
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                  {comparisonCars.length} {comparisonCars.length === 1 ? "Car" : "Cars"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {comparisonCars.length > 0 && (
                  <button
                    onClick={clearComparison}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {/* Car Headers */}
              <div
                className="sticky top-0 z-10 bg-card border-b border-border"
                style={{
                  gridTemplateColumns: `200px repeat(${comparisonCars.length}, minmax(250px, 1fr))`,
                  display: "grid",
                }}
              >
                <div className="p-4 border-r border-border bg-muted/50"></div>
                {comparisonCars.map((car) => (
                  <div
                    key={car._id}
                    className="p-4 border-r border-border last:border-r-0 relative"
                  >
                    <button
                      onClick={() => removeFromComparison(car._id!)}
                      className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="relative aspect-video mb-3 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={getCarImage(car)}
                        alt={`${car.brand} ${car.model}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="font-bold text-lg mb-1 line-clamp-1">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                      {car.variant}
                    </p>
                    <div className="text-xl font-bold text-primary">
                      ₹{car.priceInLakhs.toFixed(2)}L
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison Table */}
              <div className="divide-y divide-border">
                {categories.map((category) => (
                  <div key={category.name} className="py-4">
                    <h3 className="px-4 mb-3 text-lg font-semibold text-foreground">
                      {category.name}
                    </h3>
                    <div
                      style={{
                        gridTemplateColumns: `200px repeat(${comparisonCars.length}, minmax(250px, 1fr))`,
                        display: "grid",
                      }}
                    >
                      {category.fields.map((field) => (
                        <React.Fragment key={field.key}>
                          <div className="px-4 py-2 text-sm text-muted-foreground border-r border-border bg-muted/30">
                            {field.label}
                          </div>
                          {comparisonCars.map((car) => {
                            const value = getValue(car, field);
                            const carValue = (car as Record<string, unknown>)[field.key];
                            const isBoolean = typeof carValue === "boolean";
                            return (
                              <div
                                key={car._id}
                                className="px-4 py-2 border-r border-border last:border-r-0"
                              >
                                {isBoolean ? (
                                  <div className="flex items-center space-x-2">
                                    {carValue ? (
                                      <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <XIcon className="w-4 h-4 text-muted-foreground" />
                                    )}
                                    <span
                                      className={
                                        carValue
                                          ? "text-foreground"
                                          : "text-muted-foreground"
                                      }
                                    >
                                      {value}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-foreground">{value}</span>
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Compare up to {comparisonCars.length} cars side by side
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

