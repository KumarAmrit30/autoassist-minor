"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  TrendingUp,
} from "lucide-react";
import { ragClient, type RagChatResponse } from "@/services/ai/rag-client";
import CarCard from "@/components/features/car-card";
import { Car } from "@/types/car";

interface RagRecommendationPanelProps {
  query: string;
  onClose: () => void;
  useGeminiDirect?: boolean; // If true, use existing /api/ai/chat instead of RAG backend
}

export default function RagRecommendationPanel({
  query,
  onClose,
  useGeminiDirect = true,
}: RagRecommendationPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<RagChatResponse | null>(null);

  // Fetch recommendations on mount
  useState(() => {
    fetchRecommendations();
  });

  async function fetchRecommendations() {
    try {
      setLoading(true);
      setError(null);

      let result;
      
      if (useGeminiDirect) {
        // Use existing Gemini-powered chat endpoint (no RAG backend needed)
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error('Failed to get recommendations');
        }

        const data = await response.json();
        
        // Convert to RAG response format
        result = {
          response: data.response,
          recommendations: data.recommendations || [],
          sources: [],
          metadata: {
            sessionId: data.metadata?.sessionId || 'gemini',
            timestamp: new Date().toISOString(),
            backend: 'gemini',
          },
        };
      } else {
        // Use RAG backend (requires Qdrant)
        result = await ragClient.chat(query);
      }

      setResponse(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to get recommendations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">AI Recommendations</h2>
                <p className="text-sm text-muted-foreground">
                  Powered by RAG System
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Query Display */}
          <div className="mt-4 p-4 bg-card rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-1">Your Query:</p>
            <p className="text-foreground">{query}</p>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">
                Analyzing your requirements...
              </p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 max-w-md">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-destructive mb-2">
                      Error
                    </h3>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <button
                      onClick={fetchRecommendations}
                      className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {response && !loading && !error && (
            <div className="space-y-6">
              {/* AI Response */}
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">AI Analysis</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {response.response}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {response.recommendations.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center">
                      <TrendingUp className="w-6 h-6 mr-2 text-primary" />
                      Top Recommendations
                    </h3>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                      {response.recommendations.length} Cars
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {response.recommendations.map((car, index) => {
                      // Convert the car data to match our Car type
                      const carData: Car = {
                        _id: car._id || car.id,
                        brand: car.brand || car.make || car.Make || "",
                        model: car.model || car.Model || "",
                        variant: car.variant || car.Variant || "",
                        year: car.year || car.Year || 2024,
                        bodyType: car.bodyType || car.BodyType || "",
                        segment: car.segment || car.Segment || "",
                        priceInLakhs: car.price || car.Price || car.priceInLakhs || 0,
                        
                        // Dimensions
                        length: car.length || 4000,
                        width: car.width || 1700,
                        height: car.height || 1500,
                        wheelbase: car.wheelbase || 2500,
                        groundClearance: car.groundClearance || 165,
                        weight: car.weight || 1200,
                        turningRadius: car.turningRadius || 5,
                        fuelTank: car.fuelTank || 45,
                        
                        // Engine
                        displacement: car.displacement || 1000,
                        cylinders: car.cylinders || 3,
                        turboNA: (car.turboNA || "NA") as "Turbo" | "NA",
                        powerBhp: car.powerBhp || car.power || 60,
                        torqueNm: car.torqueNm || 90,
                        
                        // Transmission
                        transmissionType: (car.transmission || car.transmissionType || "Manual") as any,
                        gearCount: car.gearCount || 5,
                        driveType: (car.driveType || "FWD") as any,
                        
                        // Performance
                        acceleration0to100: car.acceleration0to100 || 12,
                        topSpeed: car.topSpeed || 180,
                        
                        // Fuel
                        mileageARAI: car.mileage || car.Mileage || car.mileageARAI || 15,
                        emissionStandard: car.emissionStandard || "BS6",
                        adBlueSystem: car.adBlueSystem || false,
                        
                        // Safety
                        airbags: car.airbags || 2,
                        abs: car.abs !== false,
                        esc: car.esc !== false,
                        crashTestRating: car.crashTestRating || car.rating || 4,
                        parkingSensors: car.parkingSensors || false,
                        parkingCamera: car.parkingCamera || false,
                        isofix: car.isofix || false,
                        hillHoldControl: car.hillHoldControl || false,
                        tractionControl: car.tractionControl || false,
                        electronicBrakeDistribution: car.electronicBrakeDistribution !== false,
                        
                        // Comfort
                        airConditioning: car.airConditioning !== false,
                        ventilatedSeats: car.ventilatedSeats || false,
                        keylessEntry: car.keylessEntry || false,
                        cruiseControl: car.cruiseControl || false,
                        sunroof: car.sunroof || false,
                        heatedSeats: car.heatedSeats || false,
                        lumbarSupport: car.lumbarSupport || false,
                        adjustableHeadrest: car.adjustableHeadrest !== false,
                        rearArmrest: car.rearArmrest || false,
                        cupHolders: car.cupHolders || 2,
                        powerWindows: car.powerWindows !== false,
                        centralLocking: car.centralLocking !== false,
                        
                        // Infotainment
                        touchscreenSize: car.touchscreenSize || 7,
                        carPlayAndroidAuto: car.carPlayAndroidAuto || false,
                        speakers: car.speakers || 4,
                        digitalCluster: car.digitalCluster || false,
                        connectedTech: car.connectedTech || false,
                        wirelessCharging: car.wirelessCharging || false,
                        usbPorts: car.usbPorts || 2,
                        bluetoothConnectivity: car.bluetoothConnectivity !== false,
                        
                        // Practicality
                        bootSpace: car.bootSpace || 350,
                        foldableSeats: car.foldableSeats !== false,
                        roofRails: car.roofRails || false,
                        spareWheel: (car.spareWheel || "Full") as any,
                        
                        // Exterior
                        wheelSize: car.wheelSize || 15,
                        ledHeadlights: car.ledHeadlights || false,
                        drl: car.drl || false,
                        fogLamps: car.fogLamps || false,
                        autoFoldingMirrors: car.autoFoldingMirrors || false,
                        alloyWheels: car.alloyWheels || false,
                        
                        // ADAS
                        adaptiveCruise: car.adaptiveCruise || false,
                        laneKeepAssist: car.laneKeepAssist || false,
                        collisionWarning: car.collisionWarning || false,
                        automaticEmergencyBraking: car.automaticEmergencyBraking || false,
                        blindSpotMonitor: car.blindSpotMonitor || false,
                        rearCrossTrafficAlert: car.rearCrossTrafficAlert || false,
                        driverAttentionAlert: car.driverAttentionAlert || false,
                        
                        // Ownership
                        warranty: car.warranty || "3 Years/1,00,000 km",
                        serviceInterval: car.serviceInterval || 10000,
                        roadsideAssistance: car.roadsideAssistance !== false,
                        
                        // Additional
                        images: car.images || [],
                        rating: car.rating || car.crashTestRating || 4,
                        reviewCount: car.reviewCount || 0,
                      };
                      
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <CarCard
                            car={carData}
                            onViewDetails={(id) => window.location.href = `/cars/${id}`}
                            onCompare={(id) => console.log("Compare:", id)}
                            onToggleFavorite={(id) => console.log("Favorite:", id)}
                            onToggleWishlist={(id) => console.log("Wishlist:", id)}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sources */}
              {response.sources && response.sources.length > 0 && (
                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    Based on {response.sources.length} data sources
                  </h3>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}


