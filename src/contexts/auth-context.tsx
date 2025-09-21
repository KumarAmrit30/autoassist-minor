"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  AuthContextType,
  User,
  LoginCredentials,
  SignupCredentials,
} from "@/types/user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setLastActivity] = useState<Date>(new Date());

  // Check if user is authenticated on mount
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        setLastActivity(new Date());
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh authentication (try to get new access token)
  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        setLastActivity(new Date());

        // Track activity
        localStorage.setItem("autoassist-last-activity", Date.now().toString());
        return true;
      } else {
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setIsAuthenticated(true);
        setLastActivity(new Date());

        // Store login timestamp in localStorage for session tracking
        localStorage.setItem("autoassist-last-login", new Date().toISOString());
        localStorage.setItem("autoassist-last-activity", Date.now().toString());
        localStorage.setItem(
          "autoassist-remember-me",
          credentials.rememberMe ? "true" : "false"
        );
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }, []);

  // Signup function
  const signup = useCallback(async (credentials: SignupCredentials) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setIsAuthenticated(true);
        setLastActivity(new Date());

        // Store signup timestamp for welcome flow
        localStorage.setItem(
          "autoassist-signup-date",
          new Date().toISOString()
        );
        localStorage.setItem("autoassist-last-login", new Date().toISOString());
        localStorage.setItem("autoassist-last-activity", Date.now().toString());
      } else {
        throw new Error(data.error || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async (logoutFromAllDevices: boolean = false) => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ logoutFromAllDevices }),
      });

      // Always clear local state, even if API call fails
      setUser(null);
      setIsAuthenticated(false);

      // Clear stored data
      localStorage.removeItem("autoassist-last-login");
      localStorage.removeItem("autoassist-last-activity");
      localStorage.removeItem("autoassist-remember-me");
      localStorage.removeItem("autoassist-user-preferences");

      if (!response.ok) {
        console.warn("Logout API call failed, but user logged out locally");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local state
      setUser(null);
      setIsAuthenticated(false);

      // Clear stored data
      localStorage.removeItem("autoassist-last-login");
      localStorage.removeItem("autoassist-last-activity");
      localStorage.removeItem("autoassist-remember-me");
      localStorage.removeItem("autoassist-user-preferences");
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
      } else {
        throw new Error(data.error || "Profile update failed");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  }, []);

  // Setup automatic token refresh - only for non-remember-me users
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout;

    const scheduleRefresh = () => {
      // Clear any existing timeout
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      // Check if user has remember me enabled
      const rememberMe =
        localStorage.getItem("autoassist-remember-me") === "true";

      if (rememberMe) {
        // For remember me users, only refresh when they actually use the app
        // Don't auto-refresh in the background
        return;
      }

      // For regular users, refresh in 12 minutes (access token expires in 15 minutes)
      refreshTimeout = setTimeout(async () => {
        if (isAuthenticated) {
          const success = await refreshAuth();
          if (success) {
            // Schedule next refresh
            scheduleRefresh();
          } else {
            console.warn("Token refresh failed - user may need to re-login");
            // Don't immediately log out - let user continue until they try to make a request
          }
        }
      }, 12 * 60 * 1000); // 12 minutes
    };

    if (isAuthenticated) {
      scheduleRefresh();
    }

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [isAuthenticated, refreshAuth]);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle page visibility change to refresh auth when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        const lastActivity = localStorage.getItem("autoassist-last-activity");
        const rememberMe =
          localStorage.getItem("autoassist-remember-me") === "true";
        const now = Date.now();

        // Different thresholds based on remember me status
        const refreshThreshold = rememberMe
          ? 24 * 60 * 60 * 1000 // 1 day for remember me users
          : 5 * 60 * 1000; // 5 minutes for regular users

        // Check for 15-day inactivity for remember me users
        if (rememberMe && lastActivity) {
          const fifteenDays = 15 * 24 * 60 * 60 * 1000;
          if (now - parseInt(lastActivity) > fifteenDays) {
            // Auto-logout after 15 days of inactivity
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem("autoassist-last-activity");
            localStorage.removeItem("autoassist-remember-me");
            localStorage.removeItem("autoassist-last-login");
            console.log("Auto-logged out due to 15 days of inactivity");
            return;
          }
        }

        if (!lastActivity || now - parseInt(lastActivity) > refreshThreshold) {
          refreshAuth().catch(() => {
            // If refresh fails, don't immediately log out - let the user continue
            console.warn("Token refresh failed on visibility change");
          });
        }

        // Update last activity
        localStorage.setItem("autoassist-last-activity", now.toString());
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, refreshAuth]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    refreshAuth,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
