import { NextResponse } from "next/server";
import { ObjectId, type Filter } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { createWeekDocument, serializeWeek, type WeekDocument } from "@/lib/week";

export const dynamic = "force-dynamic";

function parseUserId(
  value: string | null | undefined
): { userId: ObjectId | null } | { error: string } {
  if (value === null || value === undefined) {
    return { userId: null };
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return { userId: null };
  }

  if (!ObjectId.isValid(trimmed)) {
    return { error: "Invalid user" };
  }

  return { userId: new ObjectId(trimmed) };
}

function buildUserFilter(userId: ObjectId | null): Filter<WeekDocument> {
  if (userId) {
    return { userId };
  }

  return { $or: [{ userId: { $exists: false } }, { userId: null }] };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseUserId(searchParams.get("userId"));

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { userId } = parsed;

    const db = await getDb();
    const collection = db.collection<WeekDocument>("weeks");
    const filter: Filter<WeekDocument> = {
      status: "active",
      ...buildUserFilter(userId)
    };
    const active = await collection.findOne(filter, { sort: { createdAt: -1 } });

    if (active) {
      return NextResponse.json({ week: serializeWeek(active) });
    }

    const fresh = createWeekDocument(0, undefined, userId);
    const insertResult = await collection.insertOne(fresh);
    const inserted = { ...fresh, _id: insertResult.insertedId };
    return NextResponse.json({ week: serializeWeek(inserted) });
  } catch (error) {
    console.error("Failed to load week", error);
    return NextResponse.json({ error: "Failed to load week" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, days, userId: rawUserId } = body as {
      id?: string;
      days?: WeekDocument["days"];
      userId?: string | null;
    };

    if (!id || !Array.isArray(days)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const parsed = parseUserId(rawUserId ?? null);

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { userId } = parsed;

    const db = await getDb();
    const collection = db.collection<WeekDocument>("weeks");
    const objectId = new ObjectId(id);
    const filter: Filter<WeekDocument> = {
      _id: objectId,
      status: "active",
      ...buildUserFilter(userId)
    };

    const result = await collection.updateOne(filter, { $set: { days, updatedAt: new Date() } });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update week", error);
    return NextResponse.json({ error: "Failed to update week" }, { status: 500 });
  }
}
