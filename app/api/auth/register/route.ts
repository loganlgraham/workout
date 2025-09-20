import { NextResponse } from "next/server";
import type { WithId } from "mongodb";

import { hashPassword } from "@/lib/auth";
import {
  getUsersCollection,
  normalizeEmail,
  serializeUser,
  type UserDocument
} from "@/lib/users";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body as {
      name?: string;
      email?: string;
      password?: string;
    };

    const trimmedName = name?.trim() ?? "";
    const trimmedEmail = email?.trim() ?? "";
    const trimmedPassword = password?.trim() ?? "";

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (trimmedPassword.length < 8) {
      return NextResponse.json(
        { error: "Choose a password with at least 8 characters." },
        { status: 400 }
      );
    }

    const emailKey = normalizeEmail(trimmedEmail);
    const users = await getUsersCollection();
    const existing = await users.findOne({ email: emailKey });

    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(trimmedPassword);
    const now = new Date();

    const doc: UserDocument = {
      name: trimmedName,
      email: emailKey,
      passwordHash,
      createdAt: now,
      updatedAt: now
    };

    const insertResult = await users.insertOne(doc);
    const inserted: WithId<UserDocument> = { ...doc, _id: insertResult.insertedId };

    return NextResponse.json({ user: serializeUser(inserted) }, { status: 201 });
  } catch (error) {
    console.error("Failed to register user", error);
    return NextResponse.json({ error: "Failed to register user." }, { status: 500 });
  }
}
