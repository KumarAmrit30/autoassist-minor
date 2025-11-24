"use client";

import { useAuth } from "@/contexts/auth-context";
import { useUserPreferences } from "@/hooks/useLocalStorage";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Car,
  Heart,
  Search,
  TrendingUp,
  User,
  Calendar,
  Clock,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [preferences] = useUserPreferences();
  const [stats, setStats] = useState({
    totalCars: 0,
    favorites: 0,
    wishlist: 0,
    recentSearches: 0,
  });

  useEffect(() => {
    // Fetch user stats
    const fetchStats = async () => {
      try {
        // This would typically come from API calls
        setStats({
          totalCars: 350, // From your database
          favorites: user?.favorites?.length || 0,
          wishlist: user?.wishlist?.length || 0,
          recentSearches: 5, // Mock data
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Dashboard unavailable
          </p>
          <h1 className="mt-2 text-3xl font-bold">Authentication disabled</h1>
        </div>
        <p className="max-w-xl text-muted-foreground">
          We temporarily removed authentication to unblock deployments, so
          personalized dashboards are not accessible. You can keep exploring the
          public experience while we restore sign-in support.
        </p>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Return home</span>
        </Link>
      </div>
    );
  }

  const firstName = user.name.split(" ")[0] || user.name;

  const quickActions = [
    {
      icon: Search,
      title: "Search Cars",
      description: "Find your perfect vehicle",
      href: "/#explore",
      color: "bg-blue-500",
    },
    {
      icon: Heart,
      title: "My Favorites",
      description: `${stats.favorites} saved cars`,
      href: "/favorites",
      color: "bg-red-500",
    },
    {
      icon: TrendingUp,
      title: "Market Trends",
      description: "Latest price insights",
      href: "/market-trends",
      color: "bg-green-500",
    },
    {
      icon: Settings,
      title: "Settings",
      description: "Manage your account",
      href: "/settings",
      color: "bg-gray-500",
    },
  ];

  const statsCards = [
    {
      title: "Available Cars",
      value: stats.totalCars.toLocaleString(),
      icon: Car,
      color: "text-blue-500",
    },
    {
      title: "Favorites",
      value: stats.favorites,
      icon: Heart,
      color: "text-red-500",
    },
    {
      title: "Wishlist Items",
      value: stats.wishlist,
      icon: Calendar,
      color: "text-green-500",
    },
    {
      title: "Recent Searches",
      value: stats.recentSearches,
      icon: Clock,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            AutoAssist
          </Link>
          <div className="flex items-center space-x-6">
            <Link
              href="/#explore"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse Cars
            </Link>
            <Link
              href="/favorites"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Favorites
            </Link>
            <Link
              href="/settings"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent text-white p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Welcome back, {firstName}! 👋
                </h1>
                <p className="text-white/80">Ready to find your next car?</p>
              </div>
            </div>

            {!preferences.hasCompletedOnboarding && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/10 rounded-lg p-4 mt-4"
              >
                <p className="text-sm">
                  🎉 <strong>Welcome to AutoAssist!</strong> Complete your
                  profile to get personalized car recommendations.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
              className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.a
                key={action.title}
                href={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                className="group bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div
                  className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {action.description}
                </p>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
          <div className="bg-card rounded-xl p-8 border border-border text-center">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
            <p className="text-muted-foreground mb-4">
              Start exploring cars to see your activity here
            </p>
            <Link
              href="/#explore"
              className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Browse Cars</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
