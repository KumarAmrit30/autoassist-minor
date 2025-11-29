import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FastAPI backend URL - can be configured via environment variable
const RAG_API_URL = process.env.RAG_API_URL || "http://localhost:8000";

interface RagChatRequest {
  query: string;
  filters?: Record<string, unknown>;
  session_id?: string;
}

interface RagRecommendation {
  id?: string;
  make?: string;
  model?: string;
  name?: string;
  price?: number;
  mileage?: number;
  [key: string]: unknown;
}

interface RagSource {
  [key: string]: unknown;
}

interface RagChatResponse {
  answer: string;
  recommended: RagRecommendation[];
  sources: RagSource[];
}

/**
 * POST /api/ai/rag-chat
 * Proxy endpoint to the FastAPI RAG backend
 */
export async function POST(request: NextRequest) {
  try {
    const body: RagChatRequest = await request.json();
    const { query, filters, session_id } = body;

    // Validate query
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Generate session ID if not provided
    const sessionId =
      session_id ||
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[RAG] Sending request to ${RAG_API_URL}/chat`, {
      query,
      filters,
      sessionId,
    });

    // Call FastAPI backend
    const response = await fetch(`${RAG_API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        filters: filters || null,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[RAG] FastAPI error:`, errorText);
      
      throw new Error(
        `FastAPI backend returned ${response.status}: ${errorText}`
      );
    }

    const data: RagChatResponse = await response.json();

    console.log(`[RAG] Received ${data.recommended.length} recommendations`);
    console.log(`[RAG] Sample recommendation:`, JSON.stringify(data.recommended[0], null, 2));

    // Fetch full car data using existing API for recommendations
    // This ensures consistent data formatting and proper field mapping
    const baseUrl = request.headers.get('origin') || 
                   process.env.NEXT_PUBLIC_BASE_URL || 
                   `http://localhost:${process.env.PORT || 3000}`;
    
    const enrichedRecommendations = await Promise.all(
      data.recommended.map(async (rec: RagRecommendation, index: number) => {
        try {
          console.log(`[RAG] Processing recommendation ${index}:`, {
            keys: Object.keys(rec),
            id: rec.id,
            name: rec.name,
            make: rec.make,
            model: rec.model,
            price: rec.price,
            mileage: rec.mileage,
          });

          // RAG now returns: { id: "MongoDB _id", make: "Brand", model: "Model", name: "Brand Model", price: X, mileage: Y }
          const carId = rec.id;
          const make = rec.make || "";
          const model = rec.model || "";
          
          // First try: Use MongoDB ID directly if available
          if (carId && carId !== "Unknown" && carId !== "") {
            try {
              console.log(`[RAG] Fetching car by ID: ${carId}`);
              const carResponse = await fetch(
                `${baseUrl}/api/cars/${carId}`,
                { 
                  cache: 'no-store',
                  headers: {
                    'Content-Type': 'application/json',
                  }
                }
              );
              
              if (carResponse.ok) {
                const carData = await carResponse.json();
                if (carData.car) {
                  console.log(`[RAG] Fetched car: ${carData.car.brand} ${carData.car.model}`);
                  return carData.car; // Return the properly formatted car
                }
              }
              console.warn(`[RAG] Failed to fetch car by ID: ${carId}`);
            } catch (error) {
              console.warn(`[RAG] Error fetching car ${carId}:`, error);
            }
          }
          
          // Second try: Search by brand/model
          if (make && model && make !== "Unknown" && model !== "Unknown") {
            try {
              const searchQuery = `${make} ${model}`.trim();
              console.log(`[RAG] Searching for: "${searchQuery}"`);
              
              const searchResponse = await fetch(
                `${baseUrl}/api/cars?search=${encodeURIComponent(searchQuery)}&limit=1`,
                { 
                  cache: 'no-store',
                  headers: {
                    'Content-Type': 'application/json',
                  }
                }
              );
              
              if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                if (searchData.cars && searchData.cars.length > 0) {
                  console.log(`[RAG] Found car: ${searchData.cars[0].brand} ${searchData.cars[0].model}`);
                  return searchData.cars[0]; // Return the first matching car
                } else {
                  console.warn(`[RAG] No cars found for: ${searchQuery}`);
                }
              }
            } catch (error) {
              console.warn(`[RAG] Failed to search for car ${make} ${model}:`, error);
            }
          }
          
          console.warn(`[RAG] Could not enrich recommendation:`, rec);
          // If we can't fetch from API, return null so frontend can filter it out
          return null;
        } catch (error) {
          console.warn(`[RAG] Error enriching recommendation ${index}:`, error);
          return null;
        }
      })
    );

    // Filter out null values (failed enrichments)
    const validRecommendations = enrichedRecommendations.filter(r => r !== null);
    
    console.log(`[RAG] Enrichment complete. ${validRecommendations.length}/${data.recommended.length} recommendations enriched successfully`);

    // Return the response with enriched recommendations
    return NextResponse.json({
      response: data.answer,
      recommendations: validRecommendations,
      sources: data.sources,
      metadata: {
        sessionId,
        timestamp: new Date().toISOString(),
        backend: "rag",
        originalCount: data.recommended.length,
        enrichedCount: validRecommendations.length,
      },
    });
  } catch (error) {
    console.error("[RAG] Error in RAG chat endpoint:", error);

    // Check if it's a connection error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isConnectionError = errorMessage.includes("ECONNREFUSED") || 
                              errorMessage.includes("fetch failed");

    if (isConnectionError) {
      return NextResponse.json(
        {
          error: "RAG backend is not available. Please ensure the FastAPI server is running on port 8000.",
          details: errorMessage,
          hint: "Run: cd llm/RAG-System-for-Car-Recommendation-Chatbot && uvicorn backend.main:app --reload --port 8000",
        },
        { status: 503 }
      );
    }

    // Return user-friendly error
    return NextResponse.json(
      {
        error: "Failed to process your query with RAG system. Please try again.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/rag-chat/health
 * Check if RAG backend is available
 */
export async function GET() {
  try {
    const response = await fetch(`${RAG_API_URL}/health`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      status: "healthy",
      backend: data,
      url: RAG_API_URL,
    });
  } catch (error) {
    console.error("[RAG] Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        url: RAG_API_URL,
      },
      { status: 503 }
    );
  }
}

