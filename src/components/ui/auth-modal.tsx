"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, User, Mail, Lock, ArrowLeft } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Auth form submitted:", { isSignUp, formData });
    // TODO: Implement authentication logic
    alert(isSignUp ? "Sign up successful!" : "Sign in successful!");
    onClose();
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
    setShowPassword(false);
    setShowConfirmPassword(false);
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
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="relative p-6 pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <User className="w-8 h-8 text-primary" />
                </motion.div>

                <h2 className="text-2xl font-bold mb-2">
                  {isSignUp ? "Sign Up" : "Sign In"}
                </h2>
                <p className="text-muted-foreground">
                  {isSignUp
                    ? "Secure Your Communications with AutoAssist"
                    : "Welcome back to AutoAssist"}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Daniel Ahmadi"
                        className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required={isSignUp}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="TDanielehmadi@gmail.com"
                      className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required={isSignUp}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {!isSignUp && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                      />
                      <span className="text-muted-foreground">Remember me</span>
                    </label>
                    <button
                      type="button"
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </motion.button>
              </form>

              {/* Google Sign In */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-card text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <motion.button
                  type="button"
                  className="w-full mt-4 bg-muted hover:bg-muted/80 border border-border text-foreground py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  <span>Continue with Google</span>
                </motion.button>
              </div>

              {/* Toggle Sign In/Sign Up */}
              <div className="mt-6 text-center">
                <span className="text-muted-foreground">
                  {isSignUp ? "Already member?" : "Don't have an account?"}{" "}
                </span>
                <button
                  onClick={toggleMode}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
