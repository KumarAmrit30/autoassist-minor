"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  Star,
  Users,
  Car,
  Zap,
  Shield,
  Award,
} from "lucide-react";
import ModernSearchBar from "@/components/ui/modern-search-bar";

interface HeroSectionProps {
  onSearch: (query: string, useRag?: boolean) => void;
  onFilterClick: () => void;
}

export default function HeroSection({
  onSearch,
}: HeroSectionProps) {

  const handleAISearch = (query: string) => {
    onSearch(query, true);
  };

  const quickSearches = [
    { text: "SUV under ₹15L", icon: Car },
    { text: "Electric cars", icon: Zap },
    { text: "5-star safety", icon: Shield },
    { text: "Luxury sedans", icon: Award },
  ];

  const popularBrands = [
    "Tata",
    "Mahindra",
    "Hyundai",
    "Maruti Suzuki",
    "Toyota",
    "Honda",
  ];

  const stats = [
    { icon: TrendingUp, label: "500+", sublabel: "Cars Listed" },
    { icon: Star, label: "4.5", sublabel: "Average Rating" },
    { icon: Users, label: "50K+", sublabel: "Searches Daily" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-accent/10" />

      {/* Animated Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/4 -right-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            AI-Powered Car Search
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            Find Your{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              Perfect Car
            </span>
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover, compare, and explore the best cars with our comprehensive
            automotive platform powered by AI
          </p>
        </motion.div>

        {/* Modern Search Bar */}
        <motion.div
          className="mb-10 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <ModernSearchBar
            onSearch={handleAISearch}
            onAISearch={handleAISearch}
            placeholder="Describe your ideal car... (e.g., 'SUV under 15 lakhs with good mileage')"
            size="lg"
          />
        </motion.div>

        {/* Quick Searches */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="text-sm text-muted-foreground mb-4">Quick searches:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {quickSearches.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.text}
                  onClick={() => handleAISearch(item.text)}
                  className="group flex items-center gap-2 px-4 py-2 bg-card border border-border hover:border-primary rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-primary/10"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span>{item.text}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Popular Brands */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <p className="text-sm text-muted-foreground mb-4">Popular brands:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {popularBrands.map((brand, index) => (
              <motion.button
                key={brand}
                onClick={() => handleAISearch(`${brand} cars`)}
                className="px-5 py-2 bg-muted/50 hover:bg-primary hover:text-primary-foreground rounded-full text-sm font-medium transition-all border border-transparent hover:border-primary/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {brand}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="relative group"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1 + index * 0.15 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/50 transition-all">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-3">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
                    {stat.label}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {stat.sublabel}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          delay: 1.5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
          <motion.div
            className="w-1.5 h-1.5 bg-primary rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}
