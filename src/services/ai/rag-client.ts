/**
 * RAG Client for interacting with the FastAPI RAG backend
 */

export interface RagChatRequest {
  query: string;
  filters?: Record<string, unknown>;
  session_id?: string;
}

export interface RagChatResponse {
  response: string;
  recommendations: Array<Record<string, unknown>>;
  sources: Array<Record<string, unknown>>;
  metadata: {
    sessionId: string;
    timestamp: string;
    backend: string;
  };
}

export interface RagHealthResponse {
  status: "healthy" | "unhealthy";
  backend?: Record<string, unknown>;
  url?: string;
  error?: string;
}

export class RagClient {
  private baseUrl: string;
  private sessionId: string | null = null;

  constructor(baseUrl: string = "/api/ai/rag-chat") {
    this.baseUrl = baseUrl;
  }

  /**
   * Send a chat query to the RAG system
   */
  async chat(
    query: string,
    filters?: Record<string, unknown>
  ): Promise<RagChatResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          filters,
          session_id: this.sessionId,
        } as RagChatRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const data: RagChatResponse = await response.json();

      // Store session ID for conversation continuity
      if (data.metadata.sessionId) {
        this.sessionId = data.metadata.sessionId;
      }

      return data;
    } catch (error) {
      console.error("RAG chat error:", error);
      throw error;
    }
  }

  /**
   * Check if RAG backend is healthy
   */
  async checkHealth(): Promise<RagHealthResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          status: "unhealthy",
          error: errorData.error,
        };
      }

      return await response.json();
    } catch (error) {
      console.error("RAG health check error:", error);
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Reset session (start new conversation)
   */
  resetSession(): void {
    this.sessionId = null;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }
}

// Export singleton instance
export const ragClient = new RagClient();

