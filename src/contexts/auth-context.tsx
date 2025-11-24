"use client";

import React, { createContext, useContext, useMemo, useCallback } from "react";
import {
  AuthContextType,
  User,
  LoginCredentials,
  SignupCredentials,
} from "@/types/user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_DISABLED_MESSAGE =
  "Authentication is disabled for this deployment build.";

function warnAuthDisabled(action: string) {
  console.warn(`${action} skipped: ${AUTH_DISABLED_MESSAGE}`);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const login = useCallback(async (credentials?: LoginCredentials) => {
    void credentials;
    warnAuthDisabled("login");
  }, []);

  const signup = useCallback(async (credentials?: SignupCredentials) => {
    void credentials;
    warnAuthDisabled("signup");
  }, []);

  const logout = useCallback(async (logoutFromAllDevices?: boolean) => {
    void logoutFromAllDevices;
    warnAuthDisabled("logout");
  }, []);

  const refreshAuth = useCallback(async () => {
    warnAuthDisabled("session refresh");
    return false;
  }, []);

  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    void profileData;
    warnAuthDisabled("profile update");
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login,
      signup,
      logout,
      refreshAuth,
      updateProfile,
    }),
    [login, signup, logout, refreshAuth, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
