"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Car, Heart, Search, TrendingUp, Shield } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useUserPreferences } from "@/hooks/useLocalStorage";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useUserPreferences();
  const [currentStep, setCurrentStep] = useState(0);

  const features = [
    {
      icon: Search,
      title: "Smart Car Search",
      description:
        "Find your perfect car with our advanced AI-powered search and filtering system.",
    },
    {
      icon: Heart,
      title: "Favorites & Wishlist",
      description:
        "Save cars you love and create wishlists for future purchases.",
    },
    {
      icon: TrendingUp,
      title: "Market Insights",
      description:
        "Get real-time market data, price trends, and expert recommendations.",
    },
    {
      icon: Shield,
      title: "Verified Listings",
      description:
        "All our car listings are verified for accuracy and authenticity.",
    },
  ];

  const handleCompleteOnboarding = () => {
    setPreferences((prev) => ({
      ...prev,
      hasCompletedOnboarding: true,
      hasSeenWelcomeMessage: true,
    }));
    onClose();
  };

  const handleSkip = () => {
    setPreferences((prev) => ({
      ...prev,
      hasSeenWelcomeMessage: true,
    }));
    onClose();
  };

  const nextStep = () => {
    if (currentStep < features.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!user || preferences.hasSeenWelcomeMessage) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-primary to-accent p-8 text-white">
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <Car className="w-8 h-8" />
                </motion.div>

                <motion.h2
                  className="text-3xl font-bold mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Welcome to AutoAssist, {user.name.split(" ")[0]}! 🎉
                </motion.h2>

                <motion.p
                  className="text-white/90"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Let&apos;s get you started with your car shopping journey
                </motion.p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  className="text-center"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                    {React.createElement(features[currentStep].icon, {
                      className: "w-8 h-8 text-primary",
                    })}
                  </div>

                  <h3 className="text-2xl font-semibold mb-4">
                    {features[currentStep].title}
                  </h3>

                  <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                    {features[currentStep].description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress Indicator */}
              <div className="flex items-center justify-center space-x-2 mb-8">
                {features.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? "bg-primary w-8"
                        : index < currentStep
                        ? "bg-primary/60"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="px-6 py-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex space-x-3">
                  <button
                    onClick={handleSkip}
                    className="px-6 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip Tour
                  </button>

                  <motion.button
                    onClick={nextStep}
                    className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {currentStep === features.length - 1
                      ? "Get Started"
                      : "Next"}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
