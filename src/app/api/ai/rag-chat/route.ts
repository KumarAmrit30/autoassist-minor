import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FastAPI backend URL - can be configured via environment variable
const RAG_API_URL = process.env.RAG_API_URL || "http://localhost:8000";

interface RagChatRequest {
  query: string;
  filters?: Record<string, any>;
  session_id?: string;
}

interface RagChatResponse {
  answer: string;
  recommended: Array<Record<string, any>>;
  sources: Array<Record<string, any>>;
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

    // Return the response from FastAPI
    return NextResponse.json({
      response: data.answer,
      recommendations: data.recommended,
      sources: data.sources,
      metadata: {
        sessionId,
        timestamp: new Date().toISOString(),
        backend: "rag",
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

