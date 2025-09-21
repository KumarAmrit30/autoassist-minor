import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { User } from "@/types/user";

export async function GET(request: NextRequest) {
  try {
    // Get access token from cookie
    const accessToken = request.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token not found" },
        { status: 401 }
      );
    }

    // Verify access token
    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired access token" },
        { status: 401 }
      );
    }

    // Get user from database
    const db = await getDatabase();
    const user = (await db.collection(COLLECTIONS.USERS).findOne({
      _id: new ObjectId(payload.userId),
      isActive: true,
    })) as User | null;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prepare user data for response (without password)
    const { password: _, ...userWithoutPassword } = user;
    const responseUser = {
      ...userWithoutPassword,
      _id: user._id!.toString(),
    };

    return NextResponse.json(
      {
        user: responseUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json(
      { error: "Failed to get user profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get access token from cookie
    const accessToken = request.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token not found" },
        { status: 401 }
      );
    }

    // Verify access token
    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired access token" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate that we're not trying to update sensitive fields
    const allowedFields = ["name", "avatar", "preferences"];
    const updateData: Partial<User> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field as keyof User] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Add updated timestamp
    updateData.updatedAt = new Date();

    // Update user in database
    const db = await getDatabase();
    const result = await db
      .collection(COLLECTIONS.USERS)
      .updateOne(
        { _id: new ObjectId(payload.userId), isActive: true },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get updated user
    const updatedUser = (await db.collection(COLLECTIONS.USERS).findOne({
      _id: new ObjectId(payload.userId),
    })) as User | null;

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to retrieve updated user" },
        { status: 500 }
      );
    }

    // Prepare user data for response (without password)
    const { password: _, ...userWithoutPassword } = updatedUser;
    const responseUser = {
      ...userWithoutPassword,
      _id: updatedUser._id!.toString(),
    };

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: responseUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
