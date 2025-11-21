import { ScoringWeights, UseCaseConfig } from "./types";

// Gemini AI Configuration
export const GEMINI_CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || "",
  model: "models/gemini-2.0-flash-exp",
  temperature: 0.7,
  maxOutputTokens: 1000,
} as const;

// Default Scoring Weights
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  price: 0.25,
  mileage: 0.2,
  safety: 0.2,
  features: 0.15,
  performance: 0.1,
  comfort: 0.1,
  context: 0.0, // Applied as bonus, not weighted
};

// Use Case Configurations
export const USE_CASE_CONFIGS: Record<string, UseCaseConfig> = {
  family: {
    useCase: "family",
    filters: {
      minSeats: 7,
      bodyTypes: ["SUV", "MUV", "MPV"],
      minAirbags: 4,
    },
    scoringWeights: {
      safety: 0.3,
      comfort: 0.2,
      features: 0.2,
      price: 0.2,
      mileage: 0.1,
    },
    keywords: [
      "family",
      "7-seater",
      "7 seater",
      "kids",
      "spacious",
      "mpv",
      "suv",
      "children",
    ],
    description:
      "Family-friendly cars with spacious seating and safety features",
  },
  daily_commute: {
    useCase: "daily_commute",
    filters: {
      minMileage: 15,
    },
    scoringWeights: {
      mileage: 0.35,
      price: 0.25,
      comfort: 0.2,
      features: 0.1,
      safety: 0.1,
    },
    keywords: [
      "daily",
      "office",
      "commute",
      "city",
      "petrol",
      "diesel",
      "city driving",
    ],
    description: "Fuel-efficient cars perfect for daily city driving",
  },
  highway: {
    useCase: "highway",
    filters: {
      minMileage: 15,
    },
    scoringWeights: {
      performance: 0.3,
      comfort: 0.25,
      safety: 0.2,
      mileage: 0.15,
      price: 0.1,
    },
    keywords: [
      "highway",
      "long drive",
      "road trip",
      "touring",
      "cruising",
      "travel",
    ],
    description: "Comfortable cars for highway cruising and long drives",
  },
  first_car: {
    useCase: "first_car",
    filters: {
      maxPrice: 10,
      bodyTypes: ["Hatchback", "Sedan"],
    },
    scoringWeights: {
      price: 0.3,
      safety: 0.25,
      mileage: 0.2,
      features: 0.15,
      comfort: 0.1,
    },
    keywords: [
      "first car",
      "beginner",
      "learning",
      "starter",
      "budget",
      "affordable",
    ],
    description: "Affordable and easy-to-drive cars for first-time buyers",
  },
  luxury: {
    useCase: "luxury",
    filters: {
      minPrice: 20,
    },
    scoringWeights: {
      features: 0.3,
      comfort: 0.3,
      performance: 0.2,
      safety: 0.15,
      price: 0.05,
    },
    keywords: [
      "luxury",
      "premium",
      "high-end",
      "comfort",
      "features",
      "top model",
    ],
    description: "Premium cars with advanced features and superior comfort",
  },
  off_road: {
    useCase: "off_road",
    filters: {
      bodyTypes: ["SUV"],
      driveType: ["4WD", "AWD"],
    },
    scoringWeights: {
      performance: 0.3,
      safety: 0.25,
      features: 0.2,
      comfort: 0.15,
      price: 0.1,
    },
    keywords: [
      "off-road",
      "offroad",
      "4x4",
      "adventure",
      "terrain",
      "ground clearance",
    ],
    description: "Rugged SUVs built for off-road adventures",
  },
};

// Brand List for Detection
export const KNOWN_BRANDS = [
  "Maruti Suzuki",
  "Maruti",
  "Suzuki",
  "Hyundai",
  "Tata",
  "Mahindra",
  "Kia",
  "Honda",
  "Toyota",
  "Volkswagen",
  "VW",
  "Skoda",
  "Renault",
  "Nissan",
  "Ford",
  "Jeep",
  "MG",
  "Citroen",
  "BMW",
  "Mercedes-Benz",
  "Mercedes",
  "Audi",
  "Volvo",
  "Land Rover",
  "Jaguar",
  "Porsche",
] as const;

// Body Type List
export const BODY_TYPES = [
  "Hatchback",
  "Sedan",
  "SUV",
  "MUV",
  "MPV",
  "Coupe",
  "Convertible",
  "Wagon",
] as const;

// Transmission Types
export const TRANSMISSION_TYPES = [
  "Manual",
  "Automatic",
  "CVT",
  "DCT",
] as const;

// Price Patterns for Extraction
export const PRICE_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)/gi,
  /(?:under|below|less than)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)/gi,
  /(?:above|over|more than)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)/gi,
  /(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)/gi,
] as const;

// Mileage Patterns
export const MILEAGE_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*(?:kmpl|km\/l|kmpl\+)/gi,
  /(?:mileage|fuel efficiency).*?(\d+(?:\.\d+)?)\s*(?:kmpl|km\/l)/gi,
] as const;

// Default Response Templates
export const RESPONSE_TEMPLATES = {
  noResults:
    "I couldn't find any cars matching your requirements. Try adjusting your budget or preferences.",
  error:
    "I apologize, but I encountered an issue processing your request. Please try again.",
  success:
    "Based on your requirements, I've found {count} car{plural} that might interest you.",
  fallback: "Here are some popular options that might interest you:",
} as const;

// AI Prompt Templates
export const AI_PROMPTS = {
  extractRequirements: `You are a car recommendation assistant. Extract car requirements from the user's query and return ONLY a valid JSON object (no markdown, no explanations).

Return this exact JSON structure:
{
  "filters": {
    "maxPrice": number or null,
    "minPrice": number or null,
    "brands": string[] or null,
    "bodyTypes": string[] or null,
    "minSeats": number or null,
    "minMileage": number or null,
    "transmission": string[] or null,
    "minAirbags": number or null
  },
  "context": {
    "useCase": "family" | "daily_commute" | "highway" | "first_car" | "luxury" | "off_road" | "general",
    "priority": "price" | "safety" | "efficiency" | "features" | "performance" | "comfort"
  },
  "keywords": string[]
}

Body types must be one of: Hatchback, Sedan, SUV, MUV, MPV, Coupe, Convertible, Wagon
Transmission types: Manual, Automatic, CVT, DCT
Use case types: family, daily_commute, highway, first_car, luxury, off_road, general
Priority types: price, safety, efficiency, features, performance, comfort

User query: {query}`,

  generateResponse: `You are an expert car consultant. Generate a friendly, helpful response about the recommended cars.

User Query: {query}

Recommended Cars:
{cars}

Requirements:
- Write 2-3 sentences maximum
- Be conversational and helpful
- Highlight the most relevant features based on the query
- Don't use markdown formatting
- Don't repeat the car names (they'll be shown separately)
- Focus on why these cars match the user's needs

Generate only the response text, nothing else.`,
} as const;

// Confidence Thresholds
export const CONFIDENCE_THRESHOLDS = {
  high: 0.8,
  medium: 0.5,
  low: 0.3,
} as const;

// API Configuration
export const API_CONFIG = {
  defaultLimit: 10,
  maxLimit: 50,
  cacheTimeout: 300, // 5 minutes in seconds
} as const;
