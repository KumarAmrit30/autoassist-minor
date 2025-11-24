import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import type { SuggestionResponse, QuickFilter } from "@/services/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ai/suggestions
 * Get popular queries, trending searches, and quick filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type"); // 'popular', 'trending', 'filters', or 'all'

    // Get database
    const db = await getDatabase();

    // Build response
    const response: SuggestionResponse = {
      popularQueries: [],
      trendingSearches: [],
      quickFilters: [],
    };

    // Get popular queries (most frequent from AI_QUERIES collection)
    if (!type || type === "popular" || type === "all") {
      try {
        const popular = await db
          .collection(COLLECTIONS.AI_QUERIES)
          .aggregate([
            {
              $group: {
                _id: "$query",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ])
          .toArray();

        response.popularQueries = popular.map((p) => p._id);

        // If no data, use defaults
        if (response.popularQueries.length === 0) {
          response.popularQueries = getDefaultPopularQueries();
        }
      } catch (error) {
        console.error("Error fetching popular queries:", error);
        response.popularQueries = getDefaultPopularQueries();
      }
    }

    // Get trending searches (recent queries with good results)
    if (!type || type === "trending" || type === "all") {
      try {
        const trending = await db
          .collection(COLLECTIONS.AI_QUERIES)
          .aggregate([
            {
              $match: {
                timestamp: {
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
                resultsCount: { $gte: 3 }, // At least 3 results
              },
            },
            {
              $group: {
                _id: "$query",
                count: { $sum: 1 },
                avgResults: { $avg: "$resultsCount" },
              },
            },
            { $sort: { count: -1, avgResults: -1 } },
            { $limit: 8 },
          ])
          .toArray();

        response.trendingSearches = trending.map((t) => t._id);

        // If no data, use defaults
        if (response.trendingSearches.length === 0) {
          response.trendingSearches = getDefaultTrendingSearches();
        }
      } catch (error) {
        console.error("Error fetching trending searches:", error);
        response.trendingSearches = getDefaultTrendingSearches();
      }
    }

    // Get quick filters (predefined popular combinations)
    if (!type || type === "filters" || type === "all") {
      response.quickFilters = getQuickFilters();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in suggestions endpoint:", error);

    // Return defaults on error
    return NextResponse.json({
      popularQueries: getDefaultPopularQueries(),
      trendingSearches: getDefaultTrendingSearches(),
      quickFilters: getQuickFilters(),
    });
  }
}

/**
 * Default popular queries
 */
function getDefaultPopularQueries(): string[] {
  return [
    "Best family SUV under 15 lakhs",
    "Fuel efficient sedan for daily commute",
    "7-seater cars with good safety features",
    "Affordable hatchback for first time buyers",
    "Premium cars with sunroof and automatic transmission",
    "Tata cars under 10 lakhs",
    "Hyundai SUV with good mileage",
    "Cars with best safety rating in India",
    "Automatic transmission cars under 12 lakhs",
    "Electric cars in India",
  ];
}

/**
 * Default trending searches
 */
function getDefaultTrendingSearches(): string[] {
  return [
    "Mahindra Scorpio N",
    "Maruti Suzuki Grand Vitara",
    "Hyundai Creta vs Kia Seltos",
    "Best hybrid cars 2024",
    "Tata Nexon EV",
    "Honda City vs Hyundai Verna",
    "Toyota Fortuner alternatives",
    "Maruti Suzuki Brezza features",
  ];
}

/**
 * Quick filter presets
 */
function getQuickFilters(): QuickFilter[] {
  return [
    {
      label: "Budget Friendly (Under ₹8L)",
      query: "Affordable cars under 8 lakhs",
      filters: {
        maxPrice: 8,
      },
    },
    {
      label: "Family Cars (7-Seater)",
      query: "7-seater family cars",
      filters: {
        minSeats: 7,
        bodyTypes: ["SUV", "MUV", "MPV"],
      },
    },
    {
      label: "Fuel Efficient (20+ kmpl)",
      query: "Cars with excellent mileage",
      filters: {
        minMileage: 20,
      },
    },
    {
      label: "Luxury SUVs",
      query: "Premium luxury SUVs",
      filters: {
        bodyTypes: ["SUV"],
        minPrice: 20,
      },
    },
    {
      label: "Automatic Transmission",
      query: "Automatic cars",
      filters: {
        transmission: ["Automatic", "CVT", "DCT"],
      },
    },
    {
      label: "Safety First (6+ Airbags)",
      query: "Safest cars with maximum airbags",
      filters: {
        minAirbags: 6,
      },
    },
    {
      label: "Compact Hatchbacks",
      query: "City friendly hatchbacks",
      filters: {
        bodyTypes: ["Hatchback"],
        maxPrice: 10,
      },
    },
    {
      label: "Mid-Size Sedans",
      query: "Comfortable sedans for highway drives",
      filters: {
        bodyTypes: ["Sedan"],
        minPrice: 10,
        maxPrice: 20,
      },
    },
    {
      label: "Tata Motors",
      query: "Tata cars",
      filters: {
        brands: ["Tata"],
      },
    },
    {
      label: "Hyundai Cars",
      query: "Hyundai vehicles",
      filters: {
        brands: ["Hyundai"],
      },
    },
    {
      label: "Maruti Suzuki",
      query: "Maruti Suzuki cars",
      filters: {
        brands: ["Maruti Suzuki"],
      },
    },
    {
      label: "Mahindra SUVs",
      query: "Mahindra SUVs",
      filters: {
        brands: ["Mahindra"],
        bodyTypes: ["SUV"],
      },
    },
  ];
}

/**
 * POST /api/ai/suggestions
 * Record a suggestion click or interaction (for analytics)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type, filters } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Log the suggestion interaction
    const db = await getDatabase();
    await db.collection("suggestion_clicks").insertOne({
      query,
      type,
      filters,
      timestamp: new Date(),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging suggestion click:", error);
    // Don't fail the request
    return NextResponse.json({ success: false });
  }
}
