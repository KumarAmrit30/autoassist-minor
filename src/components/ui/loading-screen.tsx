"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export default function LoadingScreen({
  onLoadingComplete,
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => onLoadingComplete(), 500);
          return 100;
        }
        return prevProgress + 2;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* AutoAssist Logo */}
      <motion.div
        className="text-center mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-6xl font-bold text-primary mb-4">
          Auto<span className="text-accent">Assist</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Your Premium Car Information Hub
        </p>
      </motion.div>

      {/* Loading Animation */}
      <motion.div
        className="relative w-32 h-32 mb-8"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-muted"></div>

        {/* Progress Ring */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="58"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="text-primary"
            style={{
              strokeDasharray: `${2 * Math.PI * 58}`,
              strokeDashoffset: `${2 * Math.PI * 58 * (1 - progress / 100)}`,
              transition: "stroke-dashoffset 0.1s ease-out",
            }}
          />
        </svg>

        {/* Inner Circle */}
        <motion.div
          className="absolute inset-4 rounded-full bg-primary/20 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-8 h-8 rounded-full bg-primary"
            animate={{ scale: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>

      {/* Loading Text */}
      <motion.p
        className="text-muted-foreground mb-4"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Loading your automotive experience...
      </motion.p>

      {/* Progress Dots */}
      <div className="flex space-x-2">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.2,
            }}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-8 w-64 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Progress Percentage */}
      <motion.p
        className="mt-2 text-sm text-muted-foreground font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {progress}%
      </motion.p>
    </motion.div>
  );
}
