import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { loginSchema } from "@/lib/validations/auth";
import { verifyPassword } from "@/lib/auth/password";
import { generateTokenPair } from "@/lib/auth/jwt";
import { createSession, limitUserSessions } from "@/lib/auth/session";
import { User } from "@/types/user";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input data
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = validationResult.data;

    // Connect to database
    const db = await getDatabase();

    // Find user by email
    const user = (await db
      .collection(COLLECTIONS.USERS)
      .findOne({ email })) as User | null;
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.password) {
      return NextResponse.json(
        { error: "Invalid account state" },
        { status: 500 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const userId = user._id!.toString();

    // Limit concurrent sessions (max 5 active sessions per user)
    await limitUserSessions(userId, 5);

    // Generate JWT tokens
    const tokens = await generateTokenPair({
      userId,
      email: user.email,
      role: user.role,
    });

    // Create session
    const userAgent = request.headers.get("user-agent") || undefined;
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;

    await createSession(userId, userAgent, ipAddress, rememberMe);

    // Update last login time
    await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Prepare user data for response (without password)
    const { password: _, ...userWithoutPassword } = user;
    const responseUser = {
      ...userWithoutPassword,
      _id: userId,
      lastLoginAt: new Date(),
    };

    // Create response
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: responseUser,
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookies
    response.cookies.set("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    response.cookies.set("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
