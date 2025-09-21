import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { verifyRefreshToken, generateTokenPair } from "@/lib/auth/jwt";
import { getSession, updateSessionRefreshToken } from "@/lib/auth/session";
import { User } from "@/types/user";

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token not found" },
        { status: 401 }
      );
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Check if session exists and is valid
    const session = await getSession(refreshToken);
    if (!session) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 401 }
      );
    }

    // Get user from database to ensure they still exist and are active
    const db = await getDatabase();
    const user = (await db.collection(COLLECTIONS.USERS).findOne({
      _id: new ObjectId(payload.userId),
      isActive: true,
    })) as User | null;

    if (!user) {
      return NextResponse.json(
        { error: "User not found or inactive" },
        { status: 401 }
      );
    }

    // Generate new token pair
    const newTokens = await generateTokenPair({
      userId: payload.userId,
      email: user.email,
      role: user.role,
    });

    // Update session with new refresh token
    await updateSessionRefreshToken(refreshToken, newTokens.refreshToken);

    // Prepare user data for response (without password)
    const { password: _, ...userWithoutPassword } = user;
    const responseUser = {
      ...userWithoutPassword,
      _id: user._id!.toString(),
    };

    // Create response
    const response = NextResponse.json(
      {
        message: "Tokens refreshed successfully",
        user: responseUser,
      },
      { status: 200 }
    );

    // Set new secure HTTP-only cookies
    response.cookies.set("accessToken", newTokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    response.cookies.set("refreshToken", newTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh tokens" },
      { status: 500 }
    );
  }
}
