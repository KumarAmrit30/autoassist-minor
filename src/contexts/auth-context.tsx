"use client";

import React, { createContext, useContext, useMemo, useCallback } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  AuthContextType,
  User,
  LoginCredentials,
  SignupCredentials,
} from "@/types/user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type SessionUser = NonNullable<ReturnType<typeof useSession>["data"]>["user"];

function mapSessionUser(
  sessionUser?: SessionUser
): Omit<User, "password"> | null {
  if (!sessionUser) {
    return null;
  }

  return {
    _id: (sessionUser as { id?: string }).id,
    name: sessionUser?.name ?? "AutoAssist User",
    email: sessionUser?.email ?? "",
    role: "user",
    isEmailVerified: true,
    avatar: sessionUser?.image ?? undefined,
    preferences: undefined,
    favorites: (sessionUser as { favorites?: string[] }).favorites ?? [],
    wishlist: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
    isActive: true,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();

  const login = useCallback(async (_credentials?: LoginCredentials) => {
    await signIn("google", { callbackUrl: "/" });
  }, []);

  const signup = useCallback(async (_credentials?: SignupCredentials) => {
    await signIn("google", { callbackUrl: "/" });
  }, []);

  const logout = useCallback(async (_logoutFromAllDevices?: boolean) => {
    await signOut({ callbackUrl: "/" });
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      await update();
      return true;
    } catch (error) {
      console.error("Session refresh failed:", error);
      return false;
    }
  }, [update]);

  const updateProfile = useCallback(
    async (_profileData: Partial<User>) => {
      await update();
    },
    [update]
  );

  const value = useMemo<AuthContextType>(() => {
    return {
      user: mapSessionUser(session?.user),
      isLoading: status === "loading",
      isAuthenticated: status === "authenticated",
      login,
      signup,
      logout,
      refreshAuth,
      updateProfile,
    };
  }, [
    session?.user,
    status,
    login,
    signup,
    logout,
    refreshAuth,
    updateProfile,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
