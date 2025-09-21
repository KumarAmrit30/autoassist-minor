"use client";

import { motion } from "framer-motion";
import { UserX, ArrowRight, Mail, Lock } from "lucide-react";

interface UserNotFoundModalProps {
  email: string;
  onSignUpClick: () => void;
  onClose: () => void;
}

export default function UserNotFoundModal({
  email,
  onSignUpClick,
  onClose,
}: UserNotFoundModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/10 rounded-full mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <UserX className="w-8 h-8 text-orange-500" />
          </motion.div>

          {/* Title */}
          <motion.h2
            className="text-2xl font-bold mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Account Not Found
          </motion.h2>

          {/* Description */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-muted-foreground mb-4">
              We couldn&apos;t find an account associated with:
            </p>

            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-muted rounded-lg">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{email}</span>
            </div>

            <p className="text-muted-foreground mt-4">
              Would you like to create a new account?
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={onSignUpClick}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <button
              onClick={onClose}
              className="w-full text-muted-foreground hover:text-foreground py-2 transition-colors"
            >
              Try Different Email
            </button>
          </motion.div>

          {/* Security Note */}
          <motion.div
            className="mt-6 p-4 bg-muted/50 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-start space-x-2">
              <Lock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground text-left">
                For security reasons, we don&apos;t reveal whether an email is
                registered. If you have an account but can&apos;t sign in, try
                password reset.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
