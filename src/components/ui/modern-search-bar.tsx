"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, X } from "lucide-react";

interface ModernSearchBarProps {
  onSearch: (query: string) => void;
  onAISearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function ModernSearchBar({
  onSearch,
  onAISearch,
  placeholder = "Search for your perfect car...",
  className = "",
  size = "lg",
}: ModernSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Always use AI Search by default
    if (onAISearch) {
      onAISearch(query.trim());
    } else {
      onSearch(query.trim());
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const clearSearch = () => {
    setQuery("");
  };

  const sizeClasses = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-5 text-base",
    lg: "py-4 px-6 text-lg",
  };

  const buttonSizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-2.5 text-base",
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div
        className={`relative flex items-center gap-2 bg-background/80 backdrop-blur-xl border-2 rounded-2xl transition-all duration-300 ${
          isFocused
            ? "border-primary/60 shadow-lg shadow-primary/10"
            : "border-border/50 hover:border-border"
        }`}
      >
        {/* Search Icon */}
        <div className="pl-5 text-muted-foreground">
          <Search className="w-5 h-5" />
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none ${sizeClasses[size]}`}
        />

        {/* Clear Button */}
        <AnimatePresence>
          {query && (
            <motion.button
              type="button"
              onClick={clearSearch}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* AI Search Button */}
        <div className="flex items-center pr-2">
          <motion.button
            type="submit"
            className={`flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary/30 ${buttonSizeClasses[size]}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Search</span>
          </motion.button>
        </div>
      </div>

      {/* Helper Text */}
      <motion.p
        className="text-xs text-muted-foreground mt-2 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isFocused ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        Press{" "}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> for
        AI-powered search
      </motion.p>
    </form>
  );
}
