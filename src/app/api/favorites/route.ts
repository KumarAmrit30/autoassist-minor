import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";

// GET /api/favorites - Get user's favorites
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const user = await db
      .collection(COLLECTIONS.USERS)
      .findOne(
        { _id: new ObjectId(session.user.id) },
        { projection: { favorites: 1 } }
      );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get favorite cars with full details
    const favoriteCarIds = user.favorites || [];
    const favoriteCars = await db
      .collection(COLLECTIONS.CARS)
      .find({ _id: { $in: favoriteCarIds.map((id: string) => new ObjectId(id)) } })
      .toArray();

    return NextResponse.json({
      favorites: favoriteCars,
      count: favoriteCars.length,
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add car to favorites
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { carId } = await request.json();

    if (!carId) {
      return NextResponse.json(
        { error: "Car ID is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Verify car exists
    const car = await db
      .collection(COLLECTIONS.CARS)
      .findOne({ _id: new ObjectId(carId) });
    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    // Add to favorites (MongoDB will handle duplicates)
    const result = await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $addToSet: { favorites: carId },
        $set: { updatedAt: new Date() },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Car added to favorites",
      isFavorite: true,
    });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - Remove car from favorites
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const carId = searchParams.get("carId");

    if (!carId) {
      return NextResponse.json(
        { error: "Car ID is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Remove from favorites
    const result = await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $pull: { favorites: carId },
        $set: { updatedAt: new Date() },
      } as unknown as Record<string, unknown>
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Car removed from favorites",
      isFavorite: false,
    });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
