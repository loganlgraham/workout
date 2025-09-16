import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let cachedClientPromise: Promise<MongoClient> | undefined;

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (process.env.NODE_ENV === "development") {
    if (!globalThis._mongoClientPromise) {
      const client = new MongoClient(uri);
      globalThis._mongoClientPromise = client.connect();
    }
    return globalThis._mongoClientPromise!;
  }

  if (!cachedClientPromise) {
    const client = new MongoClient(uri);
    cachedClientPromise = client.connect();
  }

  return cachedClientPromise;
}

export async function getDb() {
  const client = await getClientPromise();
  const dbName = process.env.MONGODB_DB || "workout";
  return client.db(dbName);
}
