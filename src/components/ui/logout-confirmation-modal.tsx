"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, LogOut, AlertTriangle } from "lucide-react";

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onConfirm: (logoutFromAllDevices?: boolean) => void;
  onCancel: () => void;
}

export default function LogoutConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
}: LogoutConfirmationModalProps) {
  const handleLogout = (logoutFromAllDevices: boolean = false) => {
    onConfirm(logoutFromAllDevices);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 text-center">
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 10 }}
              >
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </motion.div>

              <motion.h2
                className="text-2xl font-bold text-foreground mb-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Sign Out Confirmation
              </motion.h2>

              <motion.p
                className="text-muted-foreground mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Are you sure you want to sign out? You&apos;ll need to enter
                your credentials again to access your account.
              </motion.p>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {/* Logout from current device */}
                <motion.button
                  onClick={() => handleLogout(false)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out from This Device</span>
                </motion.button>

                {/* Logout from all devices */}
                <motion.button
                  onClick={() => handleLogout(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out from All Devices</span>
                </motion.button>

                {/* Cancel */}
                <motion.button
                  onClick={onCancel}
                  className="w-full bg-muted hover:bg-muted/80 text-foreground px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </motion.div>

              <motion.div
                className="mt-6 p-4 bg-muted/50 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
