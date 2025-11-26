"use client";

import { useRouter } from "next/navigation";
import HeroSection from "@/components/features/hero-section";

export default function HomePage() {
  const router = useRouter();

  const handleSearch = (query: string, useAI: boolean = false) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // If AI Search is requested, trigger global AI chat
    if (useAI) {
      // Dispatch custom event to open AI chat with query
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("openAIChat", { detail: { query: trimmedQuery } })
        );
      }
    } else {
      // Otherwise, navigate to explore page
      router.push(`/explore?search=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const handleFilterClick = () => {
    router.push("/explore");
  };

  return (
    <HeroSection 
      onSearch={handleSearch} 
      onFilterClick={handleFilterClick}
    />
  );
}

