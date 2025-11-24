"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  User,
  Menu,
  X,
  LogOut,
  Settings,
  Heart,
  Bookmark,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import LogoutConfirmationModal from "@/components/ui/logout-confirmation-modal";

interface HeaderProps {
  onSignInClick: () => void;
}

export default function Header({ onSignInClick }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isUserMenuOpen &&
        !(event.target as Element)?.closest(".user-menu-container")
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogoutConfirm = async (logoutFromAllDevices = false) => {
    await logout(logoutFromAllDevices);
    setShowLogoutConfirmation(false);
  };

  const handleLogoutCancel = () => setShowLogoutConfirmation(false);

  const navigationItems = [
    { label: "Home", href: "hero" },
    { label: "Explore", href: "explore" },
    { label: "About", href: "about" },
    { label: "Contact", href: "contact" },
  ];

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg"
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <motion.div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => scrollToSection("hero")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h1 className="text-2xl font-bold">
                Auto<span className="text-primary">Assist</span>
              </h1>
            </motion.div>

            <nav className="hidden lg:flex items-center space-x-8">
              {navigationItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className="text-foreground/80 hover:text-primary transition-colors duration-200 font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  {item.label}
                </motion.button>
              ))}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search for cars..."
                  className="w-64 pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="relative hidden sm:block user-menu-container">
                  <motion.button
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    className="flex items-center space-x-2 bg-muted hover:bg-muted/80 text-foreground px-3 py-2 rounded-lg transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="text-sm font-medium">{user?.name}</span>
                  </motion.button>

                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50"
                    >
                      <div className="py-2">
                        <div className="px-4 py-2 border-b border-border">
                          <p className="text-sm font-medium">{user?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>

                        <Link
                          href="/dashboard"
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-muted transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Dashboard</span>
                        </Link>

                        <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-muted transition-colors">
                          <Heart className="w-4 h-4" />
                          <span>Favorites</span>
                        </button>

                        <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-muted transition-colors">
                          <Bookmark className="w-4 h-4" />
                          <span>Wishlist</span>
                        </button>

                        <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-muted transition-colors">
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>

                        <div className="border-t border-border mt-2 pt-2">
                          <button
                            onClick={handleLogoutClick}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.button
                  onClick={onSignInClick}
                  className="hidden sm:flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </motion.button>
              )}

              <button
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="lg:hidden p-2 text-foreground hover:text-primary transition-colors duration-200"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          <motion.div
            className={`lg:hidden overflow-hidden ${
              isMobileMenuOpen ? "max-h-screen" : "max-h-0"
            }`}
            initial={false}
            animate={{ height: isMobileMenuOpen ? "auto" : 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="py-4 space-y-4 border-t border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search for cars..."
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => scrollToSection(item.href)}
                    className="block w-full text-left px-4 py-2 text-foreground/80 hover:text-primary hover:bg-muted rounded-lg transition-colors duration-200"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {isAuthenticated ? (
                <div className="sm:hidden space-y-2">
                  <div className="flex items-center space-x-3 px-4 py-2 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href="/dashboard"
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>

                    <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>Favorites</span>
                    </button>

                    <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors">
                      <Bookmark className="w-4 h-4" />
                      <span>Wishlist</span>
                    </button>

                    <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>

                    <button
                      onClick={handleLogoutClick}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onSignInClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200 sm:hidden"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </motion.header>

      <LogoutConfirmationModal
        isOpen={showLogoutConfirmation}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
}
