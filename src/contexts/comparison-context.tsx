"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Car } from "@/types/car";

interface ComparisonContextType {
  comparisonCars: Car[];
  addToComparison: (car: Car) => boolean;
  removeFromComparison: (carId: string) => void;
  replaceInComparison: (oldCarId: string, newCar: Car) => void;
  clearComparison: () => void;
  isInComparison: (carId: string) => boolean;
  canAddMore: boolean;
  maxCars: number;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(
  undefined
);

const MAX_COMPARISON_CARS = 4;
const STORAGE_KEY = "car_comparison";

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [comparisonCars, setComparisonCars] = useState<Car[]>([]);

  // Fetch car details for comparison
  const fetchComparisonCars = useCallback(async (carIds: string[]) => {
    try {
      const cars: Car[] = [];
      for (const carId of carIds) {
        const response = await fetch(`/api/cars/${carId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.car) {
            cars.push(data.car);
          }
        }
      }
      setComparisonCars(cars);
    } catch (error) {
      console.error("Error fetching comparison cars:", error);
    }
  }, []);

  // Load comparison from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const carIds = JSON.parse(stored);
        // Fetch car details for stored IDs
        if (Array.isArray(carIds) && carIds.length > 0) {
          fetchComparisonCars(carIds);
        }
      }
    } catch (error) {
      console.error("Error loading comparison from localStorage:", error);
    }
  }, [fetchComparisonCars]);

  // Save comparison to localStorage whenever it changes
  useEffect(() => {
    try {
      const carIds = comparisonCars.map((car) => car._id).filter(Boolean);
      if (carIds.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(carIds));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error saving comparison to localStorage:", error);
    }
  }, [comparisonCars]);

  // Add car to comparison
  const addToComparison = useCallback(
    (car: Car): boolean => {
      if (!car._id) {
        console.error("Car ID is required for comparison");
        return false;
      }

      // Check if already in comparison
      if (comparisonCars.some((c) => c._id === car._id)) {
        return false;
      }

      // Check if max limit reached
      if (comparisonCars.length >= MAX_COMPARISON_CARS) {
        return false;
      }

      setComparisonCars((prev) => [...prev, car]);
      return true;
    },
    [comparisonCars]
  );

  // Remove car from comparison
  const removeFromComparison = useCallback((carId: string) => {
    setComparisonCars((prev) => prev.filter((car) => car._id !== carId));
  }, []);

  // Replace car in comparison (for variant switching)
  const replaceInComparison = useCallback((oldCarId: string, newCar: Car) => {
    setComparisonCars((prev) =>
      prev.map((car) => (car._id === oldCarId ? newCar : car))
    );
  }, []);

  // Clear all comparisons
  const clearComparison = useCallback(() => {
    setComparisonCars([]);
  }, []);

  // Check if car is in comparison
  const isInComparison = useCallback(
    (carId: string): boolean => {
      return comparisonCars.some((car) => car._id === carId);
    },
    [comparisonCars]
  );

  const canAddMore = comparisonCars.length < MAX_COMPARISON_CARS;

  const value: ComparisonContextType = {
    comparisonCars,
    addToComparison,
    removeFromComparison,
    replaceInComparison,
    clearComparison,
    isInComparison,
    canAddMore,
    maxCars: MAX_COMPARISON_CARS,
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
}

