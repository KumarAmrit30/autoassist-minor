"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
} from "react";
<<<<<<< HEAD

interface User {
  _id: string;
  email: string;
  name?: string;
  favorites?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
=======
import { signIn, signOut, useSession } from "next-auth/react";
import {
  AuthContextType,
  User,
  LoginCredentials,
  SignupCredentials,
} from "@/types/user";
>>>>>>> 8de438e17829d9e6c12778b44c5807da90b7fd67

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type SessionUser = NonNullable<
  ReturnType<typeof useSession>["data"]
>["user"];

function mapSessionUser(sessionUser?: SessionUser): Omit<User, "password"> | null {
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
<<<<<<< HEAD
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      // Check if we have a token in cookies
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Login error:", error);
        return false;
      }
=======
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
>>>>>>> 8de438e17829d9e6c12778b44c5807da90b7fd67
    },
    [update]
  );

<<<<<<< HEAD
  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string
    ): Promise<boolean> => {
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ name, email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Signup error:", error);
        return false;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    refreshUser,
  };
=======
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
  }, [session?.user, status, login, signup, logout, refreshAuth, updateProfile]);
>>>>>>> 8de438e17829d9e6c12778b44c5807da90b7fd67

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
<<<<<<< HEAD


=======
>>>>>>> 8de438e17829d9e6c12778b44c5807da90b7fd67
