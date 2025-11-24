// Modern JWT utilities with refresh token support

import { SignJWT, jwtVerify } from "jose";
import { JWTPayload } from "@/types/user";

// Environment variables with defaults for development
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "your-super-secret-refresh-key-change-this-in-production";

// Convert string secrets to Uint8Array for jose library
const jwtSecret = new TextEncoder().encode(JWT_SECRET);
const refreshSecret = new TextEncoder().encode(JWT_REFRESH_SECRET);

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

/**
 * Generate an access token with short expiry
 */
export async function generateAccessToken(payload: {
  userId: string;
  email: string;
  role: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return await new SignJWT({
    ...payload,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + 15 * 60) // 15 minutes
    .setIssuer("autoassist")
    .setAudience("autoassist-users")
    .sign(jwtSecret);
}

/**
 * Generate a refresh token with long expiry
 */
export async function generateRefreshToken(payload: {
  userId: string;
  email: string;
  role: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return await new SignJWT({
    ...payload,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + 7 * 24 * 60 * 60) // 7 days
    .setIssuer("autoassist")
    .setAudience("autoassist-users")
    .sign(refreshSecret);
}

/**
 * Verify an access token
 */
export async function verifyAccessToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret, {
      issuer: "autoassist",
      audience: "autoassist-users",
    });

    if (payload.type !== "access") {
      throw new Error("Invalid token type");
    }

    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error("Access token verification failed:", error);
    return null;
  }
}

/**
 * Verify a refresh token
 */
export async function verifyRefreshToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret, {
      issuer: "autoassist",
      audience: "autoassist-users",
    });

    if (payload.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error("Refresh token verification failed:", error);
    return null;
  }
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(payload: {
  userId: string;
  email: string;
  role: string;
}) {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(payload: JWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

/**
 * Get token expiration time in milliseconds
 */
export function getTokenExpirationTime(payload: JWTPayload): Date {
  return new Date(payload.exp * 1000);
}

/**
 * Create a secure random token for email verification, password reset, etc.
 */
export function generateSecureToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  // Generate a 32-character random string
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}
