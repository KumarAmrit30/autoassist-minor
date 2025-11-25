import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let clientPromise: Promise<MongoClient> | null = null;

if (!uri) {
  console.warn(
    'Missing "MONGODB_URI" environment variable. Database access will fail at runtime until it is provided.'
  );
} else if (process.env.NODE_ENV === "development") {
  // In development mode, reuse the client between HMR reloads.
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDatabase(): Promise<Db> {
  if (!clientPromise) {
    throw new Error(
      'Invalid/Missing environment variable: "MONGODB_URI". Set it to enable database access.'
    );
  }

  const client = await clientPromise;
  return client.db("autoassist");
}

// Database collections
export const COLLECTIONS = {
  CARS: "cars_new", // Updated to use cars_new collection
  USERS: "users",
  SESSIONS: "sessions",
  FAVORITES: "favorites",
  WISHLISTS: "wishlists",
  COMPARISONS: "comparisons",
  AI_QUERIES: "ai_queries",
} as const;
