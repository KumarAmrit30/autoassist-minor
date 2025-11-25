"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  Car,
  TrendingUp,
  DollarSign,
  Fuel,
  Gauge,
} from "lucide-react";
import { ragClient, type RagChatResponse } from "@/services/ai/rag-client";

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
                  <h3 className="font-semibold mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                    Recommended Cars ({response.recommendations.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {response.recommendations.map((car, index) => (
                      <CarCard key={index} car={car} rank={index + 1} />
                    ))}
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

// Car Card Component
function CarCard({ car, rank }: { car: Record<string, any>; rank: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-lg transition-all"
    >
      {/* Rank Badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-bold">
          {rank}
        </div>
        <Car className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Car Name */}
      <h4 className="font-semibold mb-2 line-clamp-1">
        {car.name || `${car.brand || car.make || car.Make || ""} ${car.model || car.Model || ""}`.trim()}
      </h4>

      {/* Details Grid */}
      <div className="space-y-2 text-sm">
        {(car.price || car.Price) && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              Price
            </span>
            <span className="font-medium">
              ₹{(car.price || car.Price).toFixed(2)}L
            </span>
          </div>
        )}

        {(car.fuel_type || car.FuelType || car.fuel) && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center">
              <Fuel className="w-4 h-4 mr-1" />
              Fuel
            </span>
            <span className="font-medium">
              {car.fuel_type || car.FuelType || car.fuel}
            </span>
          </div>
        )}

        {(car.mileage || car.Mileage) && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center">
              <Gauge className="w-4 h-4 mr-1" />
              Mileage
            </span>
            <span className="font-medium">
              {(car.mileage || car.Mileage).toFixed(1)} km/l
            </span>
          </div>
        )}

        {/* Score if available */}
        {car.score !== undefined && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Match Score</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(car.score, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium">
                  {Math.round(car.score)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

