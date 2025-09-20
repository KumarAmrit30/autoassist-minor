import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  images: {
    domains: [
      "localhost",
      "imgd.aeplcdn.com", // AutoPortal CDN
      "stimg.cardekho.com", // CarDekho CDN
      "images.unsplash.com", // Unsplash for fallbacks
      "via.placeholder.com", // Placeholder service
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imgd.aeplcdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "stimg.cardekho.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
