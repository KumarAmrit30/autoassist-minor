"use client";

import { useEffect, useState, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Clock3,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BenefitItem = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const benefitItems: BenefitItem[] = [
  {
    title: "Instant personalization",
    description:
      "Sync favorites, wishlists, and car comparisons automatically.",
    icon: Sparkles,
  },
  {
    title: "Protected by Google",
    description:
      "We rely on Google OAuth so you never manage another password.",
    icon: ShieldCheck,
  },
  {
    title: "Seamless sessions",
    description: "Stay signed in across desktop and mobile with secure tokens.",
    icon: Clock3,
  },
];

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
    }
  }, [isAuthenticated, isOpen, onClose]);

  const handleGoogleAuth = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 800);
    console.warn(
      "Authentication attempt blocked: sign-in is disabled for this deployment."
    );
  };

  const heroCopy = isSignUp
    ? {
        title: "Create your account",
        description: "Use Google to get instant access to AutoAssist.",
        badge: "New here?",
      }
    : {
        title: "Welcome back",
        description: "Continue with Google to jump right into AutoAssist.",
        badge: "Returning user",
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={onClose}
              className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
              aria-label="Close auth modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-6 p-6 sm:p-8">
              <div className="text-center">
                <motion.div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <User className="h-8 w-8 text-primary" />
                </motion.div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
                  {heroCopy.badge}
                </p>
                <h2 className="mt-2 text-3xl font-bold">{heroCopy.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {heroCopy.description}
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-left">
                    <p className="text-sm font-semibold text-muted-foreground">
                      Google single sign-on
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                      Fast, secure, and password-free authentication.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-primary/30 px-3 py-1 text-xs font-semibold text-primary/80">
                    OAuth 2.0
                  </span>
                </div>

                <motion.button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled
                  className="mt-6 flex w-full items-center justify-between rounded-2xl border border-dashed border-border bg-background/60 px-4 py-3 text-left transition-all duration-200 cursor-not-allowed opacity-70"
                >
                  <div className="flex items-center space-x-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card">
                      <GoogleIcon />
                    </span>
                    <div>
                      <p className="text-base font-semibold">
                        {isProcessing
                          ? "Hold tight..."
                          : "Sign-in temporarily disabled"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        We disabled authentication while we troubleshoot
                        deployment issues.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </motion.button>
                <p className="mt-4 text-xs text-muted-foreground">
                  We&apos;ll re-enable login once deployment issues are
                  resolved. Existing accounts remain safe.
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  What you get
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {benefitItems.map((benefit) => (
                    <div
                      key={benefit.title}
                      className="flex items-start space-x-3 rounded-xl bg-muted/30 p-3"
                    >
                      <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <benefit.icon className="h-4 w-4 text-primary" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{benefit.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* <div className="text-center text-xs text-muted-foreground">
                {isSignUp ? "Already on AutoAssist?" : "New to AutoAssist?"}{" "}
                <button
                  onClick={() => setIsSignUp((prev) => !prev)}
                  className="font-semibold text-primary hover:underline"
                >
                  {isSignUp ? "Sign in" : "Create account"}
                </button>
              </div> */}

              <p className="text-center text-[11px] text-muted-foreground">
                By continuing you agree to the AutoAssist{" "}
                <span className="cursor-pointer text-primary hover:underline">
                  Terms
                </span>{" "}
                and{" "}
                <span className="cursor-pointer text-primary hover:underline">
                  Privacy Policy
                </span>
                .
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-foreground">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
