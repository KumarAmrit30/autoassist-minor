"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
                      const carRecord = car as Record<string, unknown>;
                      const carData: Car = {
                        _id: (carRecord._id || carRecord.id) as string | undefined,
                        brand: (carRecord.brand || carRecord.make || carRecord.Make || "") as string,
                        model: (carRecord.model || carRecord.Model || "") as string,
                        variant: (carRecord.variant || carRecord.Variant || "") as string,
                        year: (carRecord.year || carRecord.Year || 2024) as number,
                        bodyType: (carRecord.bodyType || carRecord.BodyType || "") as string,
                        segment: (carRecord.segment || carRecord.Segment || "") as string,
                        priceInLakhs: (carRecord.price || carRecord.Price || carRecord.priceInLakhs || 0) as number,
                        
                        // Dimensions
                        length: (carRecord.length || 4000) as number,
                        width: (carRecord.width || 1700) as number,
                        height: (carRecord.height || 1500) as number,
                        wheelbase: (carRecord.wheelbase || 2500) as number,
                        groundClearance: (carRecord.groundClearance || 165) as number,
                        weight: (carRecord.weight || 1200) as number,
                        turningRadius: (carRecord.turningRadius || 5) as number,
                        fuelTank: (carRecord.fuelTank || 45) as number,
                        
                        // Engine
                        displacement: (carRecord.displacement || 1000) as number,
                        cylinders: (carRecord.cylinders || 3) as number,
                        turboNA: ((carRecord.turboNA || "NA") as "Turbo" | "NA"),
                        powerBhp: (carRecord.powerBhp || carRecord.power || 60) as number,
                        torqueNm: (carRecord.torqueNm || 90) as number,
                        
                        // Transmission
                        transmissionType: (car.transmission || car.transmissionType || "Manual") as Car["transmissionType"],
                        gearCount: car.gearCount || 5,
                        driveType: (car.driveType || "FWD") as Car["driveType"],
                        
                        // Performance
                        acceleration0to100: (carRecord.acceleration0to100 || 12) as number,
                        topSpeed: (carRecord.topSpeed || 180) as number,
                        
                        // Fuel
                        mileageARAI: (carRecord.mileage || carRecord.Mileage || carRecord.mileageARAI || 15) as number,
                        emissionStandard: (carRecord.emissionStandard || "BS6") as string,
                        adBlueSystem: (carRecord.adBlueSystem || false) as boolean,
                        
                        // Safety
                        airbags: (carRecord.airbags || 2) as number,
                        abs: (carRecord.abs !== false) as boolean,
                        esc: (carRecord.esc !== false) as boolean,
                        crashTestRating: (carRecord.crashTestRating || carRecord.rating || 4) as number,
                        parkingSensors: (carRecord.parkingSensors || false) as boolean,
                        parkingCamera: (carRecord.parkingCamera || false) as boolean,
                        isofix: (carRecord.isofix || false) as boolean,
                        hillHoldControl: (carRecord.hillHoldControl || false) as boolean,
                        tractionControl: (carRecord.tractionControl || false) as boolean,
                        electronicBrakeDistribution: (carRecord.electronicBrakeDistribution !== false) as boolean,
                        
                        // Comfort
                        airConditioning: (carRecord.airConditioning !== false) as boolean,
                        ventilatedSeats: (carRecord.ventilatedSeats || false) as boolean,
                        keylessEntry: (carRecord.keylessEntry || false) as boolean,
                        cruiseControl: (carRecord.cruiseControl || false) as boolean,
                        sunroof: (carRecord.sunroof || false) as boolean,
                        heatedSeats: (carRecord.heatedSeats || false) as boolean,
                        lumbarSupport: (carRecord.lumbarSupport || false) as boolean,
                        adjustableHeadrest: (carRecord.adjustableHeadrest !== false) as boolean,
                        rearArmrest: (carRecord.rearArmrest || false) as boolean,
                        cupHolders: (carRecord.cupHolders || 2) as number,
                        powerWindows: (carRecord.powerWindows !== false) as boolean,
                        centralLocking: (carRecord.centralLocking !== false) as boolean,
                        
                        // Infotainment
                        touchscreenSize: (carRecord.touchscreenSize || 7) as number,
                        carPlayAndroidAuto: (carRecord.carPlayAndroidAuto || false) as boolean,
                        speakers: (carRecord.speakers || 4) as number,
                        digitalCluster: (carRecord.digitalCluster || false) as boolean,
                        connectedTech: (carRecord.connectedTech || false) as boolean,
                        wirelessCharging: (carRecord.wirelessCharging || false) as boolean,
                        usbPorts: (carRecord.usbPorts || 2) as number,
                        bluetoothConnectivity: (carRecord.bluetoothConnectivity !== false) as boolean,
                        
                        // Practicality
                        bootSpace: (carRecord.bootSpace || 350) as number,
                        foldableSeats: (carRecord.foldableSeats !== false) as boolean,
                        roofRails: (carRecord.roofRails || false) as boolean,
                        spareWheel: ((carRecord.spareWheel || "Full") as Car["spareWheel"]),
                        
                        // Exterior
                        wheelSize: (carRecord.wheelSize || 15) as number,
                        ledHeadlights: (carRecord.ledHeadlights || false) as boolean,
                        drl: (carRecord.drl || false) as boolean,
                        fogLamps: (carRecord.fogLamps || false) as boolean,
                        autoFoldingMirrors: (carRecord.autoFoldingMirrors || false) as boolean,
                        alloyWheels: (carRecord.alloyWheels || false) as boolean,
                        
                        // ADAS
                        adaptiveCruise: (carRecord.adaptiveCruise || false) as boolean,
                        laneKeepAssist: (carRecord.laneKeepAssist || false) as boolean,
                        collisionWarning: (carRecord.collisionWarning || false) as boolean,
                        automaticEmergencyBraking: (carRecord.automaticEmergencyBraking || false) as boolean,
                        blindSpotMonitor: (carRecord.blindSpotMonitor || false) as boolean,
                        rearCrossTrafficAlert: (carRecord.rearCrossTrafficAlert || false) as boolean,
                        driverAttentionAlert: (carRecord.driverAttentionAlert || false) as boolean,
                        
                        // Ownership
                        warranty: (carRecord.warranty || "3 Years/1,00,000 km") as string,
                        serviceInterval: (carRecord.serviceInterval || 10000) as number,
                        roadsideAssistance: (carRecord.roadsideAssistance !== false) as boolean,
                        
                        // Additional
                        images: (carRecord.images || []) as string[],
                        rating: (carRecord.rating || carRecord.crashTestRating || 4) as number,
                        reviewCount: (carRecord.reviewCount || 0) as number,
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


