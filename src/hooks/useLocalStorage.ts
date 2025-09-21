// Hook for managing user preferences and onboarding state

import { useState, useEffect } from "react";

type UserPreferences = {
  hasCompletedOnboarding: boolean;
  preferredTheme: "light" | "dark" | "system";
  hasSeenWelcomeMessage: boolean;
  lastLoginDate: string | null;
  favoriteFilters: Record<string, unknown>;
};

const defaultPreferences: UserPreferences = {
  hasCompletedOnboarding: false,
  preferredTheme: "system",
  hasSeenWelcomeMessage: false,
  lastLoginDate: null,
  favoriteFilters: {},
};

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        setValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  const setStoredValue = (newValue: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [value, setStoredValue, isLoading] as const;
}

export function useUserPreferences() {
  return useLocalStorage("autoassist-user-preferences", defaultPreferences);
}
