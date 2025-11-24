
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret-key-change-in-production";

export interface JWTPayload {
  userId: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * Verify and decode JWT token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) { 
    console.error("JWT verification failed:", error);
    return null;
  }
} 



/**

/**
 * Generate a refresh token with long expiry
 */
export async function generateAccessToken(payload: {
  userId: string;
  email: string;
  role: string;
}): Promise<string> {
  return jwt.sign(payload as Record<string, unknown>, JWT_SECRET, { expiresIn: "15m" });
}

/**
 * Verify an access token
 */
export async function verifyAccessToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Access token verification failed:", error);
    return null;
  }
}

/** 
 * Generate JWT access token
 * @param payload - Token payload data
 * @param expiresIn - Token expiration time (default: 15m)
 * @returns JWT token string
 */
export function generateToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
  expiresIn: string = "15m"
): string {
  return jwt.sign(payload as Record<string, unknown>, JWT_SECRET, { expiresIn: "15m" });
}

/**
 * Verify refresh token
 * @param token - Refresh token string
 * @returns Decoded payload or null if invalid
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Refresh token verification failed:", error);
    return null;
  }
}


/**
 * Generate refresh token
 * @param payload - Token payload data
 * @param expiresIn - Token expiration time (default: 7d)
 * @returns JWT refresh token string
 */
export function generateRefreshToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
  expiresIn: string = "7d"
): string {
  return jwt.sign(payload as Record<string, unknown>, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}


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
    return (payload.exp ?? 0) <= now;
}

/**
 * Get token expiration time in milliseconds
 */
export function getTokenExpirationTime(payload: JWTPayload): Date {
  return new Date((payload.exp ?? 0) * 1000);
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
