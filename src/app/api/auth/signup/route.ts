import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { signupSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/auth/password";
import { generateTokenPair } from "@/lib/auth/jwt";
import { createSession } from "@/lib/auth/session";
// User types imported for type definitions

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input data
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Connect to database
    const db = await getDatabase();

    // Check if user already exists
    const existingUser = await db
      .collection(COLLECTIONS.USERS)
      .findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user document
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: "user" as const,
      isEmailVerified: false,
      favorites: [],
      wishlist: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      preferences: {
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        theme: "system" as const,
        language: "en",
      },
    };

    // Insert user into database
    const result = await db.collection(COLLECTIONS.USERS).insertOne(newUser);
    const userId = result.insertedId.toString();

    // Generate JWT tokens
    const tokens = await generateTokenPair({
      userId,
      email,
      role: newUser.role,
    });

    // Create session
    const userAgent = request.headers.get("user-agent") || undefined;
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;

    await createSession(userId, userAgent, ipAddress, false);

    // Prepare user data for response (without password)
    const { password: _, ...userWithoutPassword } = newUser;
    const responseUser = {
      ...userWithoutPassword,
      _id: userId,
    };

    // Create response with HTTP-only cookies
    const response = NextResponse.json(
      {
        message: "User created successfully",
        user: responseUser,
      },
      { status: 201 }
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
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
