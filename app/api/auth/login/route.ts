import { NextResponse } from "next/server";
import type { WithId } from "mongodb";

import { verifyPassword } from "@/lib/auth";
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
    const { email, password } = body as {
      email?: string;
      password?: string;
    };

    const trimmedEmail = email?.trim() ?? "";
    const trimmedPassword = password?.trim() ?? "";

    if (!trimmedEmail || !trimmedPassword) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const users = await getUsersCollection();
    const normalizedEmail = normalizeEmail(trimmedEmail);
    const user = await users.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const valid = verifyPassword(trimmedPassword, user.passwordHash);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const now = new Date();
    await users.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: now, updatedAt: now } }
    );

    const updated: WithId<UserDocument> = { ...user, lastLoginAt: now, updatedAt: now };

    return NextResponse.json({ user: serializeUser(updated) });
  } catch (error) {
    console.error("Failed to log in user", error);
    return NextResponse.json({ error: "Failed to log in user." }, { status: 500 });
  }
}
