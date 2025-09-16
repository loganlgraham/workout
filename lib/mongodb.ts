import { MongoClient } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let cachedClient: MongoClient | null = null;

async function getClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise!;
  }

  if (!cachedClient) {
    cachedClient = attachDatabasePool("default", new MongoClient(uri));
  }
  return cachedClient;
}

export async function getDb() {
  const client = await getClient();
  const dbName = process.env.MONGODB_DB || "workout";
  return client.db(dbName);
}
