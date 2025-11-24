/**
 * Example Usage of AI Car Recommendation System
 *
 * This file demonstrates how to use the AI services directly.
 * For production use, call the API endpoints instead.
 */

import { geminiClient } from "./client";
import { carFilterService, carScoringService } from "../car-data";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { Car } from "@/types/car";

/**
 * Example 1: Extract requirements from natural language
 */
export async function exampleExtractRequirements() {
  const query = "Show me family SUVs under 15 lakhs with good safety features";

  const requirements = await geminiClient.extractRequirements(query);

  console.log("Extracted Requirements:", {
    filters: requirements.filters,
    context: requirements.context,
    keywords: requirements.keywords,
    confidence: requirements.confidence,
  });

  return requirements;
}

/**
 * Example 2: Complete recommendation flow
 */
export async function exampleCompleteFlow() {
  const query =
    "I need a fuel-efficient car for daily office commute under 10 lakhs";

  // Step 1: Extract requirements
  const requirements = await geminiClient.extractRequirements(query);
  console.log("Requirements:", requirements);

  // Step 2: Get cars from database
  const db = await getDatabase();
  const carsCollection = db.collection<Car>(COLLECTIONS.CARS);

  // Build MongoDB query
  const mongoQuery = carFilterService.buildMongoQuery(requirements.filters);
  const cars = await carsCollection.find(mongoQuery).limit(50).toArray();

  console.log(`Found ${cars.length} cars matching filters`);

  // Step 3: Filter cars
  const filteredCars = carFilterService.filterCars(cars, requirements.filters);
  console.log(`After filtering: ${filteredCars.length} cars`);

  // Step 4: Score and rank
  const recommendations = carScoringService.scoreCars(
    filteredCars,
    requirements.filters,
    requirements.context
  );

  console.log("Top 5 Recommendations:");
  recommendations.slice(0, 5).forEach((rec, idx) => {
    console.log(`${idx + 1}. ${rec.name}`);
    console.log(
      `   Price: ₹${rec.price}L | Mileage: ${rec.mileage} kmpl | Score: ${rec.score}`
    );
    console.log(`   Highlights: ${rec.highlights.join(", ")}`);
  });

  // Step 5: Generate response
  const response = await geminiClient.generateResponse(
    recommendations,
    requirements,
    query
  );

  console.log("\nAI Response:", response);

  return recommendations;
}

/**
 * Example 3: Direct filtering (no AI)
 */
export async function exampleDirectFiltering() {
  const db = await getDatabase();
  const carsCollection = db.collection<Car>(COLLECTIONS.CARS);

  // Define filters directly
  const filters = {
    maxPrice: 12,
    brands: ["Tata", "Mahindra"],
    bodyTypes: ["SUV"],
    minMileage: 15,
  };

  // Build query and fetch
  const mongoQuery = carFilterService.buildMongoQuery(filters);
  const cars = await carsCollection.find(mongoQuery).toArray();

  console.log(
    `Found ${cars.length} Tata/Mahindra SUVs under ₹12L with 15+ kmpl`
  );

  return cars;
}

/**
 * Example 4: Testing different use cases
 */
export async function exampleUseCases() {
  const queries = [
    "Best family car with 7 seats",
    "Affordable first car for beginners",
    "Luxury sedan with all features",
    "Off-road capable SUV",
    "Fuel efficient car for city driving",
  ];

  for (const query of queries) {
    console.log(`\n--- Query: ${query} ---`);
    const requirements = await geminiClient.extractRequirements(query);
    console.log("Use Case:", requirements.context.useCase);
    console.log("Priority:", requirements.context.priority);
    console.log("Filters:", requirements.filters);
  }
}

/**
 * Example API Request Bodies
 */
export const exampleAPIRequests = {
  // POST /api/ai/chat
  chat: {
    query: "Show me safe family cars under 20 lakhs",
    context: {
      useCase: "family",
      priority: "safety",
    },
  },

  // POST /api/ai/search
  search: {
    filters: {
      maxPrice: 15,
      bodyTypes: ["SUV"],
      minAirbags: 6,
    },
    limit: 10,
    page: 1,
    sortBy: "price",
    sortOrder: "asc",
  },

  // GET /api/ai/suggestions
  // No body required
};

/**
 * Example cURL commands
 */
export const exampleCURLCommands = {
  chat: `
curl -X POST http://localhost:3000/api/ai/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "Show me safe family cars under 20 lakhs",
    "context": {
      "useCase": "family",
      "priority": "safety"
    }
  }'
  `,

  search: `
curl -X POST http://localhost:3000/api/ai/search \\
  -H "Content-Type: application/json" \\
  -d '{
    "filters": {
      "maxPrice": 15,
      "bodyTypes": ["SUV"],
      "minAirbags": 6
    },
    "limit": 10,
    "sortBy": "price"
  }'
  `,

  searchGET: `
curl "http://localhost:3000/api/ai/search?maxPrice=15&bodyTypes=SUV&minAirbags=6&sortBy=price"
  `,

  suggestions: `
curl http://localhost:3000/api/ai/suggestions
  `,
};
