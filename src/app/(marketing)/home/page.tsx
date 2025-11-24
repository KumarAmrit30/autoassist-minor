"use client";

import { useRouter } from "next/navigation";
import HeroSection from "@/components/features/hero-section";

export default function HomePage() {
  const router = useRouter();

  const handleSearch = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    router.push(`/explore?search=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleFilterClick = () => {
    router.push("/explore");
  };

  return (
    <HeroSection onSearch={handleSearch} onFilterClick={handleFilterClick} />
  );
}

