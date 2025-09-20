import type { Collection, WithId } from "mongodb";

import { getDb } from "./mongodb";

export type UserDocument = {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
};

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

let usersCollectionPromise: Promise<Collection<UserDocument>> | null = null;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  if (!usersCollectionPromise) {
    usersCollectionPromise = (async () => {
      const db = await getDb();
      const collection = db.collection<UserDocument>("users");
      await collection.createIndex({ email: 1 }, { unique: true });
      return collection;
    })();
  }

  return usersCollectionPromise;
}

export async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const collection = await getUsersCollection();
  return collection.findOne({ email: normalized });
}

export function serializeUser(doc: WithId<UserDocument>): UserResponse {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    lastLoginAt: doc.lastLoginAt ? doc.lastLoginAt.toISOString() : null
  };
}
