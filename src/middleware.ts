// Next.js middleware for authentication and route protection

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";

// Define protected routes and their required roles
const protectedRoutes = {
  // User routes - require any authenticated user
  "/dashboard": ["user", "admin", "moderator"],
  "/profile": ["user", "admin", "moderator"],
  "/favorites": ["user", "admin", "moderator"],
  "/wishlist": ["user", "admin", "moderator"],
  "/compare": ["user", "admin", "moderator"],

  // Admin routes - require admin role
  "/admin": ["admin"],
  "/admin/users": ["admin"],
  "/admin/cars": ["admin", "moderator"],
  "/admin/analytics": ["admin"],

  // API routes that require authentication
  "/api/auth/me": ["user", "admin", "moderator"],
  "/api/auth/logout": ["user", "admin", "moderator"],
  "/api/cars/favorites": ["user", "admin", "moderator"],
  "/api/cars/wishlist": ["user", "admin", "moderator"],
  "/api/admin": ["admin"],
};

// Routes that should redirect authenticated users away (login, signup pages)
const guestOnlyRoutes = ["/login", "/signup", "/forgot-password"];

// Public API routes that don't require authentication
const publicApiRoutes = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/refresh",
  "/api/cars",
  "/api/placeholder",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, _next routes, and favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check if route is public API route
  const isPublicApiRoute = publicApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicApiRoute) {
    return NextResponse.next();
  }

  // Get access token from cookies
  const accessToken = request.cookies.get("accessToken")?.value;

  // Verify token and get user info
  let user: { userId: string; email: string; role: string } | null = null;

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    }
  }

  const isAuthenticated = !!user;

  // Handle guest-only routes (redirect authenticated users)
  if (guestOnlyRoutes.includes(pathname) && isAuthenticated) {
    // Redirect authenticated users away from auth pages
    const returnUrl = request.nextUrl.searchParams.get("return");
    const targetUrl = returnUrl && returnUrl.startsWith("/") ? returnUrl : "/";
    return NextResponse.redirect(new URL(targetUrl, request.url));
  }

  // Check if route requires authentication
  const requiredRoles =
    protectedRoutes[pathname as keyof typeof protectedRoutes];

  if (requiredRoles) {
    // Route requires authentication
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("return", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has required role
    if (!requiredRoles.includes(user!.role)) {
      // User doesn't have required role
      if (pathname.startsWith("/api/")) {
        // Return 403 for API routes
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      } else {
        // Redirect to unauthorized page for regular routes
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }
  }

  // Add user info to request headers for API routes
  if (isAuthenticated && pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set("x-user-id", user!.userId);
    response.headers.set("x-user-email", user!.email);
    response.headers.set("x-user-role", user!.role);
    return response;
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
