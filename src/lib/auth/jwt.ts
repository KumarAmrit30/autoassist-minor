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
 * Generate JWT access token
 * @param payload - Token payload data
 * @param expiresIn - Token expiration time (default: 15m)
 * @returns JWT token string
 */
export function generateToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
  expiresIn: string = "15m"
): string {
  return jwt.sign(payload as Record<string, unknown>, JWT_SECRET, { expiresIn });
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
  return jwt.sign(payload as Record<string, unknown>, JWT_REFRESH_SECRET, { expiresIn });
}

