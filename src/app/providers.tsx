"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { ComparisonProvider } from "@/contexts/comparison-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ComparisonProvider>{children}</ComparisonProvider>
    </AuthProvider>
  );
}
