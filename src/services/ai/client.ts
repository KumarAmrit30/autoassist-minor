import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ExtractedRequirements,
  CarFilters,
  ChatContext,
  CarRecommendation,
} from "./types";
import {
  GEMINI_CONFIG,
  AI_PROMPTS,
  USE_CASE_CONFIGS,
  KNOWN_BRANDS,
  BODY_TYPES,
} from "./config";

export class GeminiClient {
  private ai: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;

  constructor() {
    if (!GEMINI_CONFIG.apiKey) {
      console.warn(
        "GEMINI_API_KEY not found, AI features will use fallback patterns"
      );
    }
    this.ai = new GoogleGenerativeAI(GEMINI_CONFIG.apiKey);
    this.model = this.ai.getGenerativeModel({ model: GEMINI_CONFIG.model });
  }

  /**
   * Extract car requirements from natural language query
   */
  async extractRequirements(query: string): Promise<ExtractedRequirements> {
    try {
      if (!GEMINI_CONFIG.apiKey) {
        return this.fallbackExtraction(query);
      }

      const prompt = AI_PROMPTS.extractRequirements.replace("{query}", query);
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Clean the response - remove markdown code blocks if present
      const cleanedText = this.cleanJsonResponse(text);
      const parsed = JSON.parse(cleanedText);

      return {
        filters: this.normalizeFilters(parsed.filters || {}),
        context: parsed.context || { useCase: "general" },
        keywords: parsed.keywords || [],
        confidence: 0.8,
      };
    } catch (error) {
      console.error("Error extracting requirements with AI:", error);
      return this.fallbackExtraction(query);
    }
  }

  /**
   * Generate natural language response about recommendations
   */
  async generateResponse(
    cars: CarRecommendation[],
    requirements: ExtractedRequirements,
    query: string
  ): Promise<string> {
    try {
      if (!GEMINI_CONFIG.apiKey || cars.length === 0) {
        return this.fallbackResponse(cars, requirements, query);
      }

      // Create a summary of top 3 cars
      const carsSummary = cars
        .slice(0, 3)
        .map(
          (car, idx) =>
            `${idx + 1}. ${car.name} (₹${car.price}L) - ${car.highlights
              .slice(0, 2)
              .join(", ")}`
        )
        .join("\n");

      const prompt = AI_PROMPTS.generateResponse
        .replace("{query}", query)
        .replace("{cars}", carsSummary);

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return text.trim();
    } catch (error) {
      console.error("Error generating response with AI:", error);
      return this.fallbackResponse(cars, requirements, query);
    }
  }

  /**
   * Analyze context from query (use case and priority)
   */
  analyzeContext(query: string): ChatContext {
    const lowerQuery = query.toLowerCase();

    // Detect use case
    let useCase: ChatContext["useCase"] = "general";
    let maxMatches = 0;

    for (const config of Object.values(USE_CASE_CONFIGS)) {
      const matches = config.keywords.filter((keyword) =>
        lowerQuery.includes(keyword.toLowerCase())
      ).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        useCase = config.useCase;
      }
    }

    // Detect priority
    let priority: ChatContext["priority"] | undefined;
    if (lowerQuery.match(/budget|cheap|affordable|price|cost/i)) {
      priority = "price";
    } else if (lowerQuery.match(/safe|safety|airbag|crash|rating/i)) {
      priority = "safety";
    } else if (lowerQuery.match(/mileage|fuel|efficiency|economy|kmpl/i)) {
      priority = "efficiency";
    } else if (lowerQuery.match(/feature|tech|connectivity|infotainment/i)) {
      priority = "features";
    } else if (lowerQuery.match(/power|performance|speed|acceleration/i)) {
      priority = "performance";
    } else if (lowerQuery.match(/comfort|luxury|spacious|seat/i)) {
      priority = "comfort";
    }

    return {
      useCase,
      priority,
      preferences: [],
    };
  }

  /**
   * Fallback extraction using pattern matching
   */
  private fallbackExtraction(query: string): ExtractedRequirements {
    const lowerQuery = query.toLowerCase();
    const filters: CarFilters = {};
    const keywords: string[] = [];

    // Extract price
    const priceMatch = lowerQuery.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)/i);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      if (lowerQuery.match(/under|below|less than/i)) {
        filters.maxPrice = price;
        keywords.push(`under ${price}L`);
      } else if (lowerQuery.match(/above|over|more than/i)) {
        filters.minPrice = price;
        keywords.push(`above ${price}L`);
      } else {
        filters.maxPrice = price;
        keywords.push(`${price}L`);
      }
    }

    // Extract price range
    const rangeMatch = lowerQuery.match(
      /(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)/i
    );
    if (rangeMatch) {
      filters.minPrice = parseFloat(rangeMatch[1]);
      filters.maxPrice = parseFloat(rangeMatch[2]);
      keywords.push(`${rangeMatch[1]}-${rangeMatch[2]}L`);
    }

    // Extract brands
    const brands: string[] = [];
    for (const brand of KNOWN_BRANDS) {
      if (lowerQuery.includes(brand.toLowerCase())) {
        brands.push(brand);
        keywords.push(brand);
      }
    }
    if (brands.length > 0) {
      filters.brands = brands;
    }

    // Extract body types
    const bodyTypes: string[] = [];
    for (const bodyType of BODY_TYPES) {
      if (lowerQuery.includes(bodyType.toLowerCase())) {
        bodyTypes.push(bodyType);
        keywords.push(bodyType);
      }
    }
    if (bodyTypes.length > 0) {
      filters.bodyTypes = bodyTypes;
    }

    // Extract seating
    const seatingMatch = lowerQuery.match(/(\d+)[\s-]?seater/i);
    if (seatingMatch) {
      filters.minSeats = parseInt(seatingMatch[1]);
      keywords.push(`${seatingMatch[1]}-seater`);
    }

    // Extract mileage
    const mileageMatch = lowerQuery.match(/(\d+(?:\.\d+)?)\s*(?:kmpl|km\/l)/i);
    if (mileageMatch) {
      filters.minMileage = parseFloat(mileageMatch[1]);
      keywords.push(`${mileageMatch[1]} kmpl`);
    }

    // Extract transmission
    if (lowerQuery.match(/automatic|auto/i)) {
      filters.transmission = ["Automatic", "CVT", "DCT"];
      keywords.push("Automatic");
    } else if (lowerQuery.match(/manual/i)) {
      filters.transmission = ["Manual"];
      keywords.push("Manual");
    }

    // Analyze context
    const context = this.analyzeContext(query);

    // Apply use case filters if detected
    if (context.useCase && context.useCase !== "general") {
      const useCaseConfig = USE_CASE_CONFIGS[context.useCase];
      if (useCaseConfig?.filters) {
        Object.assign(filters, {
          ...useCaseConfig.filters,
          ...filters, // Keep explicit filters from query
        });
      }
    }

    return {
      filters,
      context,
      keywords,
      confidence: keywords.length > 0 ? 0.6 : 0.3,
    };
  }

  /**
   * Fallback response generation
   */
  private fallbackResponse(
    cars: CarRecommendation[],
    requirements: ExtractedRequirements,
    query: string
  ): string {
    void query;
    if (cars.length === 0) {
      return "I couldn't find any cars matching your exact requirements. Try adjusting your budget or preferences for better results.";
    }

    const context = requirements.context;
    let response = "";

    if (cars.length === 1) {
      response = `I found the perfect match for you! `;
    } else if (cars.length <= 3) {
      response = `I found ${cars.length} great options that match your needs. `;
    } else {
      response = `I found ${cars.length} excellent cars for you. `;
    }

    // Add context-specific message
    if (context.useCase === "family") {
      response +=
        "These cars offer spacious seating and strong safety features, perfect for family trips.";
    } else if (context.useCase === "daily_commute") {
      response +=
        "These cars are fuel-efficient and perfect for daily city driving.";
    } else if (context.useCase === "highway") {
      response +=
        "These cars provide comfort and performance for long highway drives.";
    } else if (context.useCase === "first_car") {
      response +=
        "These are affordable, reliable options perfect for first-time car buyers.";
    } else if (context.useCase === "luxury") {
      response +=
        "These premium cars offer top-notch features and superior comfort.";
    } else if (requirements.filters.maxPrice) {
      response += `All options are within your budget of ₹${requirements.filters.maxPrice} lakhs.`;
    } else {
      response +=
        "Each one has been carefully selected based on your preferences.";
    }

    return response;
  }

  /**
   * Clean JSON response from Gemini (remove markdown code blocks)
   */
  private cleanJsonResponse(text: string): string {
    // Remove markdown code blocks
    let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    return cleaned;
  }

  /**
   * Normalize filters to ensure proper types
   */
  private normalizeFilters(filters: Partial<CarFilters>): CarFilters {
    const normalized: CarFilters = {};

    if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
      normalized.maxPrice = Number(filters.maxPrice);
    }
    if (filters.minPrice !== null && filters.minPrice !== undefined) {
      normalized.minPrice = Number(filters.minPrice);
    }
    if (Array.isArray(filters.brands) && filters.brands.length > 0) {
      normalized.brands = filters.brands;
    }
    if (Array.isArray(filters.bodyTypes) && filters.bodyTypes.length > 0) {
      normalized.bodyTypes = filters.bodyTypes;
    }
    if (filters.minSeats !== null && filters.minSeats !== undefined) {
      normalized.minSeats = Number(filters.minSeats);
    }
    if (filters.maxSeats !== null && filters.maxSeats !== undefined) {
      normalized.maxSeats = Number(filters.maxSeats);
    }
    if (filters.minMileage !== null && filters.minMileage !== undefined) {
      normalized.minMileage = Number(filters.minMileage);
    }
    if (
      Array.isArray(filters.transmission) &&
      filters.transmission.length > 0
    ) {
      normalized.transmission = filters.transmission;
    }
    if (filters.minAirbags !== null && filters.minAirbags !== undefined) {
      normalized.minAirbags = Number(filters.minAirbags);
    }
    if (
      filters.minSafetyRating !== null &&
      filters.minSafetyRating !== undefined
    ) {
      normalized.minSafetyRating = Number(filters.minSafetyRating);
    }

    return normalized;
  }
}

// Export singleton instance
export const geminiClient = new GeminiClient();
