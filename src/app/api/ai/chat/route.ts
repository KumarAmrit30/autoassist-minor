import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { geminiClient } from "@/services/ai";
import { carFilterService, carScoringService } from "@/services/car-data";
import { mapDatabaseCarsToAppCars } from "@/services/car-data/mapper";
import type { ChatRequest, ChatResponse } from "@/services/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/chat
 * Main AI chat endpoint for car recommendations
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ChatRequest = await request.json();
    const { query, sessionId, context } = body;

    // Validate query
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Generate session ID if not provided
    const currentSessionId =
      sessionId ||
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Step 1: Extract requirements from query using AI
    const requirements = await geminiClient.extractRequirements(query);

    // Merge context if provided
    if (context) {
      requirements.context = {
        ...requirements.context,
        ...context,
      };
    }

    // Step 2: Get all cars from database
    const db = await getDatabase();
    const carsCollection = db.collection(COLLECTIONS.CARS);

    // Build MongoDB query
    const mongoQuery = carFilterService.buildMongoQuery(requirements.filters);

    // Fetch cars with filters and map to app format
    let dbCars = await carsCollection.find(mongoQuery).limit(100).toArray();
    let cars = mapDatabaseCarsToAppCars(dbCars);

    // If too few results, try relaxing filters
    if (cars.length < 3 && Object.keys(mongoQuery).length > 0) {
      console.log("Too few results, relaxing filters...");
      // Try without some filters
      const relaxedQuery = { ...mongoQuery };
      delete relaxedQuery.minMileage;
      delete relaxedQuery.transmission;

      dbCars = await carsCollection.find(relaxedQuery).limit(100).toArray();
      cars = mapDatabaseCarsToAppCars(dbCars);
    }

    // If still no results, get all cars
    if (cars.length === 0) {
      dbCars = await carsCollection.find({}).limit(50).toArray();
      cars = mapDatabaseCarsToAppCars(dbCars);
    }

    // Step 3: Apply additional client-side filtering
    const filteredCars = carFilterService.filterCars(
      cars,
      requirements.filters
    );

    // Step 4: Score and rank cars
    const scoredCars = carScoringService.scoreCars(
      filteredCars.length > 0 ? filteredCars : cars,
      requirements.filters,
      requirements.context
    );

    // Step 5: Get top recommendations
    const topRecommendations = scoredCars.slice(0, 10);

    // Step 6: Generate natural language response
    const responseText = await geminiClient.generateResponse(
      topRecommendations,
      requirements,
      query
    );

    // Step 7: Build response
    const response: ChatResponse = {
      response: responseText,
      recommendations: topRecommendations,
      metadata: {
        totalFound: scoredCars.length,
        sessionId: currentSessionId,
        timestamp: new Date().toISOString(),
        confidence: requirements.confidence,
        queryType: requirements.context.useCase || "general",
        filtersApplied: requirements.filters,
      },
    };

    // Step 8: Log query for analytics (optional)
    try {
      await carsCollection.db.collection(COLLECTIONS.AI_QUERIES).insertOne({
        sessionId: currentSessionId,
        query,
        requirements,
        resultsCount: scoredCars.length,
        timestamp: new Date(),
      });
    } catch (logError) {
      console.error("Failed to log query:", logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in AI chat endpoint:", error);

    // Return user-friendly error
    return NextResponse.json(
      {
        error: "Failed to process your query. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/chat
 * Get chat history or session info
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const queries = await db
      .collection(COLLECTIONS.AI_QUERIES)
      .find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      sessionId,
      queries,
      count: queries.length,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}
