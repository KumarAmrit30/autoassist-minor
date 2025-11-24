import { Car } from "@/types/car";

// Chat Request & Context
export interface ChatRequest {
  query: string;
  sessionId?: string;
  context?: ChatContext;
}

export interface ChatContext {
  useCase?:
    | "family"
    | "daily_commute"
    | "highway"
    | "first_car"
    | "luxury"
    | "off_road"
    | "general";
  priority?:
    | "price"
    | "safety"
    | "efficiency"
    | "features"
    | "performance"
    | "comfort";
  preferences?: string[];
  previousQuery?: string;
}

// Chat Response
export interface ChatResponse {
  response: string;
  recommendations: CarRecommendation[];
  metadata: ResponseMetadata;
}

export interface CarRecommendation {
  id: string;
  name: string;
  price: number;
  brand: string;
  bodyType: string;
  mileage: number;
  score: number;
  highlights: string[];
  car?: Car; // Full car object for detailed view
}

export interface ResponseMetadata {
  totalFound: number;
  sessionId: string;
  timestamp: string;
  confidence: number;
  queryType?: string;
  filtersApplied?: CarFilters;
}

// Car Filters
export interface CarFilters {
  maxPrice?: number;
  minPrice?: number;
  brands?: string[];
  bodyTypes?: string[];
  minSeats?: number;
  maxSeats?: number;
  minMileage?: number;
  transmission?: ("Manual" | "Automatic" | "CVT" | "DCT")[];
  minSafetyRating?: number;
  minAirbags?: number;
  requiredFeatures?: string[];
  segment?: string[];
  fuelType?: string;
  driveType?: ("FWD" | "AWD" | "4WD" | "RWD")[];
}

// Requirements Extraction
export interface ExtractedRequirements {
  filters: CarFilters;
  context: ChatContext;
  keywords: string[];
  confidence: number;
}

// Scoring Configuration
export interface ScoringWeights {
  price: number;
  mileage: number;
  safety: number;
  features: number;
  performance: number;
  comfort: number;
  context: number;
}

// Use Case Configuration
export interface UseCaseConfig {
  useCase: ChatContext["useCase"];
  filters: Partial<CarFilters>;
  scoringWeights: Partial<ScoringWeights>;
  keywords: string[];
  description: string;
}

// Search API Types
export interface SearchRequest {
  filters: CarFilters;
  limit?: number;
  page?: number;
  sortBy?: "price" | "mileage" | "rating" | "year";
  sortOrder?: "asc" | "desc";
}

export interface SearchResponse {
  cars: Car[];
  total: number;
  page: number;
  limit: number;
  filters: CarFilters;
}

// Suggestions API Types
export interface SuggestionResponse {
  popularQueries: string[];
  trendingSearches: string[];
  quickFilters: QuickFilter[];
}

export interface QuickFilter {
  label: string;
  query: string;
  filters: CarFilters;
}
