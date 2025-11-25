"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Sparkles,
  Filter,
  TrendingUp,
  Star,
  Users,
} from "lucide-react";

interface HeroSectionProps {
  onSearch: (query: string, useRag?: boolean) => void;
  onFilterClick: () => void;
}

export default function HeroSection({
  onSearch,
  onFilterClick,
}: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = (useRag: boolean = false) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery, useRag);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Use RAG by default (Ctrl/Cmd + Enter for regular search)
      const useRag = !e.metaKey && !e.ctrlKey;
      handleSearch(useRag);
    }
  };

  const popularBrands = [
    "Hyundai",
    "Maruti Suzuki",
    "Tata",
    "Mahindra",
    "Toyota",
    "Honda",
    "Kia",
    "Jeep",
  ];
  const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid"];

  const stats = [
    { icon: TrendingUp, label: "500+", sublabel: "Cars Listed" },
    { icon: Star, label: "4.5", sublabel: "Average Rating" },
    { icon: Users, label: "50K+", sublabel: "Searches Daily" },
  ];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10" />

      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Heading */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6">
            Find Your{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Perfect Car
            </span>
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover, compare, and explore the best cars with our comprehensive
            automotive platform powered by AI
          </p>
        </motion.div>

        {/* AI Search Interface */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="max-w-4xl mx-auto">
            <div
              className={`relative bg-card border-2 rounded-2xl p-2 transition-all duration-300 ${
                isSearchFocused
                  ? "border-primary shadow-2xl shadow-primary/20"
                  : "border-border"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-primary pl-4">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium">AI Search</span>
                </div>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe your ideal car... (e.g., 'SUV under 15 lakhs with good mileage')"
                    className="w-full py-4 px-4 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-lg"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={onFilterClick}
                    className="p-3 text-muted-foreground hover:text-primary transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Browse with filters"
                  >
                    <Filter className="w-5 h-5" />
                  </motion.button>

                  {/* RAG AI Search Button */}
                  <motion.button
                    onClick={() => handleSearch(true)}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="AI-powered recommendations"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span className="hidden sm:inline">AI Search</span>
                  </motion.button>

                  {/* Regular Search Button */}
                  <motion.button
                    onClick={() => handleSearch(false)}
                    className="bg-muted hover:bg-muted/80 text-foreground px-6 py-3 rounded-xl font-medium transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Standard search"
                  >
                    <Search className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Filters */}
        <motion.div
          className="mb-12 space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Popular Brands */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Popular Brands:
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {popularBrands.map((brand, index) => (
                <motion.button
                  key={brand}
                  onClick={() => setSearchQuery(`${brand} cars`)}
                  className="px-4 py-2 bg-muted hover:bg-primary hover:text-primary-foreground rounded-full text-sm font-medium transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                >
                  {brand}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Fuel Types */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Fuel Type:
            </h3>
            <div className="flex justify-center gap-2">
              {fuelTypes.map((fuel, index) => (
                <motion.button
                  key={fuel}
                  onClick={() => setSearchQuery(`${fuel} cars`)}
                  className="px-4 py-2 bg-muted hover:bg-accent hover:text-accent-foreground rounded-full text-sm font-medium transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                >
                  {fuel}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 + index * 0.2 }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-3">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.sublabel}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
