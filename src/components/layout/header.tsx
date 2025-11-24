"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, User, LogOut, Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

interface HeaderProps {
  onSignInClick: () => void;
}

export default function Header({ onSignInClick }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  const navigationItems = [
    { label: "Home", href: "hero" },
    { label: "Explore", href: "explore" },
    { label: "About", href: "about" },
    { label: "Contact", href: "contact" },
  ];

  return (
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
          {/* Logo */}
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

          {/* Desktop Navigation */}
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

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search for cars..."
                className="w-64 pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Auth Controls */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <motion.button
                onClick={onSignInClick}
                className="hidden sm:flex items-center space-x-2 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-primary/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </motion.button>
            ) : (
              <div className="hidden items-center space-x-3 sm:flex">
                <div className="flex items-center space-x-2 rounded-full border border-border bg-muted/50 px-3 py-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                    {session?.user?.name?.charAt(0)?.toUpperCase() ?? "A"}
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Signed in as</p>
                    <p className="text-sm font-medium">
                      {session?.user?.name ?? session?.user?.email}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center space-x-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:border-red-500/50 hover:text-red-500"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </motion.button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-foreground transition-colors duration-200 hover:text-primary lg:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          className={`lg:hidden overflow-hidden ${
            isMobileMenuOpen ? "max-h-screen" : "max-h-0"
          }`}
          initial={false}
          animate={{ height: isMobileMenuOpen ? "auto" : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="py-4 space-y-4 border-t border-border">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search for cars..."
                className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>

            {/* Mobile Navigation */}
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

            {/* Mobile Auth Controls */}
            {!isAuthenticated ? (
              <button
                onClick={() => {
                  onSignInClick();
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center space-x-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 sm:hidden"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            ) : (
              <button
                onClick={async () => {
                  await signOut({ callbackUrl: "/" });
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center space-x-2 rounded-lg border border-border px-4 py-2 text-left font-medium text-muted-foreground transition-colors duration-200 hover:border-red-500/50 hover:text-red-500 sm:hidden"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
