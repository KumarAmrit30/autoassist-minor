"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { X as XIcon, Trash2, GitCompare, Check, ArrowLeft, Home } from "lucide-react";
import { Car } from "@/types/car";
import Image from "next/image";
import { useComparison } from "@/contexts/comparison-context";
import Link from "next/link";

export default function ComparePage() {
  const router = useRouter();
  const { comparisonCars, removeFromComparison, clearComparison } =
    useComparison();

  // Redirect if no cars to compare
  useEffect(() => {
    if (comparisonCars.length === 0) {
      router.push("/explore");
    }
  }, [comparisonCars.length, router]);

  if (comparisonCars.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No cars to compare</p>
          <Link
            href="/explore"
            className="text-primary hover:underline"
          >
            Go to Explore
          </Link>
        </div>
      </div>
    );
  }

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

  const getValue = (car: Car, field: { key: string; format?: (v: any) => string }) => {
    const value = (car as any)[field.key];
    if (value === undefined || value === null) return "N/A";
    if (field.format) {
      return field.format(value);
    }
    return value.toString();
  };

  const categories = getComparisonData();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Back Button */}
            <Link
              href="/explore"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Explore</span>
            </Link>

            {/* Title */}
            <div className="flex items-center space-x-3">
              <GitCompare className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Compare Cars</h1>
              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                {comparisonCars.length} {comparisonCars.length === 1 ? "Car" : "Cars"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {comparisonCars.length > 0 && (
                <button
                  onClick={clearComparison}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Car Headers - Sticky */}
        <div
          className="sticky top-20 z-30 bg-card border border-border rounded-t-xl overflow-hidden mb-4"
          style={{
            gridTemplateColumns: `200px repeat(${comparisonCars.length}, minmax(250px, 1fr))`,
            display: "grid",
          }}
        >
          <div className="p-4 border-r border-border bg-muted/50"></div>
          {comparisonCars.map((car) => (
            <div
              key={car._id}
              className="p-4 border-r border-border last:border-r-0 relative bg-card"
            >
              {/* Remove Button - More Prominent */}
              <button
                onClick={() => removeFromComparison(car._id!)}
                className="absolute top-2 right-2 p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 hover:border-destructive/50 transition-all cursor-pointer group"
                title="Remove from comparison"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              
              <Link
                href={`/cars/${car._id}`}
                className="block group"
              >
                <div className="relative aspect-video mb-3 rounded-lg overflow-hidden bg-muted group-hover:opacity-90 transition-opacity">
                  <Image
                    src={getCarImage(car)}
                    alt={`${car.brand} ${car.model}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                  {car.brand} {car.model}
                </h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                  {car.variant}
                </p>
                <div className="text-xl font-bold text-primary">
                  ₹{car.priceInLakhs.toFixed(2)}L
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {categories.map((category) => (
              <div key={category.name} className="py-6">
                <h3 className="px-6 mb-4 text-xl font-semibold text-foreground">
                  {category.name}
                </h3>
                <div
                  className="overflow-x-auto"
                  style={{
                    gridTemplateColumns: `200px repeat(${comparisonCars.length}, minmax(250px, 1fr))`,
                    display: "grid",
                  }}
                >
                  {category.fields.map((field) => (
                    <React.Fragment key={field.key}>
                      <div className="px-6 py-3 text-sm font-medium text-muted-foreground border-r border-border bg-muted/30">
                        {field.label}
                      </div>
                      {comparisonCars.map((car) => {
                        const value = getValue(car, field);
                        const isBoolean = typeof (car as any)[field.key] === "boolean";
                        return (
                          <div
                            key={car._id}
                            className="px-6 py-3 border-r border-border last:border-r-0"
                          >
                                {isBoolean ? (
                                  <div className="flex items-center space-x-2">
                                    {(car as any)[field.key] ? (
                                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    ) : (
                                  <XIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                )}
                                <span
                                  className={
                                    (car as any)[field.key]
                                      ? "text-foreground font-medium"
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

        {/* Empty State if all cars removed */}
        {comparisonCars.length === 0 && (
          <div className="text-center py-16">
            <GitCompare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No cars to compare</h3>
            <p className="text-muted-foreground mb-6">
              Add cars to your comparison to see them side by side
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Explore Cars</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

