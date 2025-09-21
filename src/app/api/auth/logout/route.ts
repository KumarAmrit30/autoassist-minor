import { NextRequest, NextResponse } from "next/server";
import {
  invalidateSession,
  invalidateAllUserSessions,
} from "@/lib/auth/session";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
  try {
    // Get tokens from cookies
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    // Check if user wants to logout from all devices
    const body = await request.json().catch(() => ({}));
    const logoutFromAllDevices = body.logoutFromAllDevices === true;

    let userId: string | null = null;

    // Try to get user ID from access token
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload) {
        userId = payload.userId;
      }
    }

    // Invalidate sessions
    if (logoutFromAllDevices && userId) {
      // Logout from all devices
      const invalidatedCount = await invalidateAllUserSessions(userId);
      console.log(
        `Invalidated ${invalidatedCount} sessions for user ${userId}`
      );
    } else if (refreshToken) {
      // Logout from current device only
      const success = await invalidateSession(refreshToken);
      if (!success) {
        console.warn(
          "Failed to invalidate session, token may already be invalid"
        );
      }
    }

    // Create response
    const response = NextResponse.json(
      {
        message: logoutFromAllDevices
          ? "Logged out from all devices successfully"
          : "Logout successful",
      },
      { status: 200 }
    );

    // Clear authentication cookies
    response.cookies.set("accessToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    // Even if there's an error, clear cookies and return success
    // (graceful degradation - user should be logged out on client side)
    const response = NextResponse.json(
      { message: "Logout completed" },
      { status: 200 }
    );

    // Clear cookies
    response.cookies.set("accessToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return response;
  }
}
