"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Car } from "@/types/car";
import { useAuth } from "./auth-context";

interface FavoritesContextType {
  favorites: string[];
  favoriteCars: Car[];
  isLoading: boolean;
  addToFavorites: (carId: string) => Promise<boolean>;
  removeFromFavorites: (carId: string) => Promise<boolean>;
  toggleFavorite: (carId: string) => Promise<boolean>;
  isFavorite: (carId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteCars, setFavoriteCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load favorites when user is authenticated
  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      setFavoriteCars([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/favorites", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const carIds = data.favorites.map((car: Car) => car._id);
        setFavorites(carIds);
        setFavoriteCars(data.favorites);
      } else {
        console.error("Failed to load favorites");
        setFavorites([]);
        setFavoriteCars([]);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
      setFavorites([]);
      setFavoriteCars([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Add car to favorites
  const addToFavorites = useCallback(
    async (carId: string): Promise<boolean> => {
      try {
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ carId }),
        });

        if (response.ok) {
          setFavorites((prev) => [...prev, carId]);
          return true;
        } else {
          console.error("Failed to add to favorites");
          return false;
        }
      } catch (error) {
        console.error("Error adding to favorites:", error);
        return false;
      }
    },
    []
  );

  // Remove car from favorites
  const removeFromFavorites = useCallback(
    async (carId: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/favorites?carId=${carId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (response.ok) {
          setFavorites((prev) => prev.filter((id) => id !== carId));
          setFavoriteCars((prev) => prev.filter((car) => car._id !== carId));
          return true;
        } else {
          console.error("Failed to remove from favorites");
          return false;
        }
      } catch (error) {
        console.error("Error removing from favorites:", error);
        return false;
      }
    },
    []
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    async (carId: string): Promise<boolean> => {
      const isCurrentlyFavorite = favorites.includes(carId);

      if (isCurrentlyFavorite) {
        return await removeFromFavorites(carId);
      } else {
        return await addToFavorites(carId);
      }
    },
    [favorites, addToFavorites, removeFromFavorites]
  );

  // Check if car is favorite
  const isFavorite = useCallback(
    (carId: string): boolean => {
      return favorites.includes(carId);
    },
    [favorites]
  );

  // Refresh favorites from server
  const refreshFavorites = useCallback(async () => {
    await loadFavorites();
  }, [loadFavorites]);

  // Load favorites when authentication status changes
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Initialize favorites from user data if available
  useEffect(() => {
    if (user?.favorites && user.favorites.length > 0) {
      setFavorites(user.favorites);
    }
  }, [user]);

  const value: FavoritesContextType = {
    favorites,
    favoriteCars,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    refreshFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
