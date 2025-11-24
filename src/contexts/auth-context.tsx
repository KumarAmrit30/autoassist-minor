"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { signIn, signOut, useSession } from "next-auth/react";

interface User {
  _id: string;
  email: string;
  name?: string;
  image?: string | null;
  favorites?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<boolean>;
  signup: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();

  const login = useCallback(async (): Promise<boolean> => {
    await signIn("google", { callbackUrl: "/" });
    return true;
  }, []);

  const signup = useCallback(async (): Promise<boolean> => {
    await signIn("google", { callbackUrl: "/" });
    return true;
  }, []);

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: "/" });
  }, []);

  const refreshUser = useCallback(async () => {
    await update();
  }, [update]);

  const value = useMemo<AuthContextType>(() => {
    const mappedUser: User | null = session?.user
      ? {
          _id: session.user.id,
          email: session.user.email ?? "",
          name: session.user.name ?? undefined,
          image: session.user.image ?? null,
          favorites: session.user.favorites ?? [],
        }
      : null;

    return {
      user: mappedUser,
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      login,
      signup,
      logout,
      refreshUser,
    };
  }, [session, status, login, signup, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


