// Session management utilities for MongoDB

import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { AuthSession } from "@/types/user";
import { generateSecureToken } from "./jwt";

/**
 * Create a new session in the database
 */
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string,
  rememberMe: boolean = false
): Promise<AuthSession> {
  const db = await getDatabase();
  const refreshToken = generateSecureToken();

  // Set session duration based on rememberMe
  const sessionDuration = rememberMe
    ? 15 * 24 * 60 * 60 * 1000 // 15 days for remember me
    : 24 * 60 * 60 * 1000; // 1 day for regular sessions

  const sessionData = {
    userId,
    refreshToken,
    userAgent,
    ipAddress,
    isValid: true,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + sessionDuration),
  };

  const result = await db
    .collection(COLLECTIONS.SESSIONS)
    .insertOne(sessionData);

  return {
    ...sessionData,
    _id: result.insertedId.toString(),
  };
}

/**
 * Get a session by refresh token
 */
export async function getSession(
  refreshToken: string
): Promise<AuthSession | null> {
  const db = await getDatabase();

  const session = await db.collection(COLLECTIONS.SESSIONS).findOne({
    refreshToken,
    isValid: true,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    return null;
  }

  return {
    ...session,
    _id: session._id.toString(),
  } as AuthSession;
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<AuthSession[]> {
  const db = await getDatabase();

  const sessions = await db
    .collection(COLLECTIONS.SESSIONS)
    .find({
      userId,
      isValid: true,
      expiresAt: { $gt: new Date() },
    })
    .sort({ createdAt: -1 })
    .toArray();

  return sessions.map((session) => ({
    ...session,
    _id: session._id.toString(),
  })) as AuthSession[];
}

/**
 * Invalidate a specific session
 */
export async function invalidateSession(
  refreshToken: string
): Promise<boolean> {
  const db = await getDatabase();

  const result = await db
    .collection(COLLECTIONS.SESSIONS)
    .updateOne({ refreshToken }, { $set: { isValid: false } });

  return result.modifiedCount > 0;
}

/**
 * Invalidate all sessions for a user (logout from all devices)
 */
export async function invalidateAllUserSessions(
  userId: string
): Promise<number> {
  const db = await getDatabase();

  const result = await db
    .collection(COLLECTIONS.SESSIONS)
    .updateMany({ userId }, { $set: { isValid: false } });

  return result.modifiedCount;
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const db = await getDatabase();

  const result = await db.collection(COLLECTIONS.SESSIONS).deleteMany({
    $or: [{ expiresAt: { $lt: new Date() } }, { isValid: false }],
  });

  return result.deletedCount;
}

/**
 * Update session with new refresh token
 */
export async function updateSessionRefreshToken(
  oldRefreshToken: string,
  newRefreshToken: string
): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.collection(COLLECTIONS.SESSIONS).updateOne(
    { refreshToken: oldRefreshToken, isValid: true },
    {
      $set: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Extend expiry
      },
    }
  );

  return result.modifiedCount > 0;
}

/**
 * Get session statistics for a user
 */
export async function getSessionStats(userId: string) {
  const db = await getDatabase();

  const [activeSessions, totalSessions] = await Promise.all([
    db.collection(COLLECTIONS.SESSIONS).countDocuments({
      userId,
      isValid: true,
      expiresAt: { $gt: new Date() },
    }),
    db.collection(COLLECTIONS.SESSIONS).countDocuments({ userId }),
  ]);

  return {
    activeSessions,
    totalSessions,
  };
}

/**
 * Limit the number of active sessions per user
 */
export async function limitUserSessions(
  userId: string,
  maxSessions: number = 5
): Promise<void> {
  const db = await getDatabase();

  // Get all active sessions, sorted by creation date (oldest first)
  const sessions = await db
    .collection(COLLECTIONS.SESSIONS)
    .find({
      userId,
      isValid: true,
      expiresAt: { $gt: new Date() },
    })
    .sort({ createdAt: 1 })
    .toArray();

  // If we have more sessions than allowed, invalidate the oldest ones
  if (sessions.length > maxSessions) {
    const sessionsToInvalidate = sessions.slice(
      0,
      sessions.length - maxSessions
    );
    const sessionIds = sessionsToInvalidate.map((s) => s._id);

    await db
      .collection(COLLECTIONS.SESSIONS)
      .updateMany({ _id: { $in: sessionIds } }, { $set: { isValid: false } });
  }
}
