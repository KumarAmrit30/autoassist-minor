import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { Car } from "@/types/car";
import { carFilterService } from "@/services/car-data";
import { mapDatabaseCarsToAppCars } from "@/services/car-data/mapper";
import type { SearchRequest, SearchResponse } from "@/services/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/search
 * Direct search endpoint with explicit filters (no AI processing)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: SearchRequest = await request.json();
    const {
      filters,
      limit = 20,
      page = 1,
      sortBy = "price",
      sortOrder = "asc",
    } = body;

    // Validate filters
    if (!filters || typeof filters !== "object") {
      return NextResponse.json(
        { error: "Filters are required" },
        { status: 400 }
      );
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 100); // Cap at 100 results per page

    // Get database
    const db = await getDatabase();
    const carsCollection = db.collection(COLLECTIONS.CARS);

    // Build MongoDB query
    const mongoQuery = carFilterService.buildMongoQuery(filters);

    // Build sort criteria (using database field names)
    const sortCriteria: any = {};
    switch (sortBy) {
      case "price":
        sortCriteria.Price_Lakhs = sortOrder === "asc" ? 1 : -1;
        break;
      case "mileage":
        sortCriteria.Fuel_and_Emissions_Mileage_ARAI_kmpl =
          sortOrder === "asc" ? -1 : 1; // Higher mileage first for desc
        break;
      case "year":
        sortCriteria.Identification_Year_of_Manufacture =
          sortOrder === "asc" ? 1 : -1;
        break;
      case "rating":
        sortCriteria.Safety_Crash_Test_Rating = sortOrder === "asc" ? 1 : -1;
        break;
      default:
        sortCriteria.Price_Lakhs = 1;
    }

    // Fetch cars with pagination
    const [dbCars, total] = await Promise.all([
      carsCollection
        .find(mongoQuery)
        .sort(sortCriteria)
        .skip(skip)
        .limit(maxLimit)
        .toArray(),
      carsCollection.countDocuments(mongoQuery),
    ]);

    // Map database format to app format
    const cars = mapDatabaseCarsToAppCars(dbCars);

    // Apply additional client-side filtering if needed
    const filteredCars = carFilterService.filterCars(cars, filters);

    // Build response
    const response: SearchResponse = {
      cars: filteredCars,
      total: filteredCars.length,
      page,
      limit: maxLimit,
      filters,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in search endpoint:", error);

    return NextResponse.json(
      {
        error: "Failed to search cars. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/search
 * Search with query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters into filters
    const filters: any = {};

    // Price filters
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);

    // Brand filter
    const brands = searchParams.get("brands");
    if (brands) filters.brands = brands.split(",").map((b) => b.trim());

    // Body type filter
    const bodyTypes = searchParams.get("bodyTypes");
    if (bodyTypes)
      filters.bodyTypes = bodyTypes.split(",").map((t) => t.trim());

    // Transmission filter
    const transmission = searchParams.get("transmission");
    if (transmission)
      filters.transmission = transmission.split(",").map((t) => t.trim());

    // Mileage filter
    const minMileage = searchParams.get("minMileage");
    if (minMileage) filters.minMileage = parseFloat(minMileage);

    // Safety filters
    const minAirbags = searchParams.get("minAirbags");
    if (minAirbags) filters.minAirbags = parseInt(minAirbags);

    const minSafetyRating = searchParams.get("minSafetyRating");
    if (minSafetyRating) filters.minSafetyRating = parseInt(minSafetyRating);

    // Seating
    const minSeats = searchParams.get("minSeats");
    if (minSeats) filters.minSeats = parseInt(minSeats);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Sort
    const sortBy = (searchParams.get("sortBy") as any) || "price";
    const sortOrder = (searchParams.get("sortOrder") as any) || "asc";

    // Get database
    const db = await getDatabase();
    const carsCollection = db.collection<Car>(COLLECTIONS.CARS);

    // Build MongoDB query
    const mongoQuery = carFilterService.buildMongoQuery(filters);

    // Build sort criteria (using database field names)
    const sortCriteria: any = {};
    switch (sortBy) {
      case "price":
        sortCriteria.Price_Lakhs = sortOrder === "asc" ? 1 : -1;
        break;
      case "mileage":
        sortCriteria.Fuel_and_Emissions_Mileage_ARAI_kmpl =
          sortOrder === "asc" ? -1 : 1;
        break;
      case "year":
        sortCriteria.Identification_Year_of_Manufacture =
          sortOrder === "asc" ? 1 : -1;
        break;
      case "rating":
        sortCriteria.Safety_Crash_Test_Rating = sortOrder === "asc" ? 1 : -1;
        break;
      default:
        sortCriteria.Price_Lakhs = 1;
    }

    // Calculate skip
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 100);

    // Fetch cars
    const [dbCars, total] = await Promise.all([
      carsCollection
        .find(mongoQuery)
        .sort(sortCriteria)
        .skip(skip)
        .limit(maxLimit)
        .toArray(),
      carsCollection.countDocuments(mongoQuery),
    ]);

    // Map database format to app format
    const cars = mapDatabaseCarsToAppCars(dbCars);

    // Build response
    const response: SearchResponse = {
      cars,
      total,
      page,
      limit: maxLimit,
      filters,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in search GET endpoint:", error);

    return NextResponse.json(
      {
        error: "Failed to search cars. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
