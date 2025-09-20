import { NextResponse } from "next/server";
import { ObjectId, type Filter } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { WEEK_TEMPLATES } from "@/lib/templates";
import {
  createWeekDocument,
  serializeWeek,
  type WeekDocument,
  nextTemplateIndex,
  getWeekStart
} from "@/lib/week";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, days, templateIndex, userId: rawUserId } = body as {
      id?: string;
      days?: WeekDocument["days"];
      templateIndex?: number;
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
    const existing = await collection.findOne(filter);

    if (!existing) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    await collection.updateOne(
      filter,
      {
        $set: {
          days,
          status: "archived",
          archivedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    let newTemplateIndex: number;

    if (typeof templateIndex === "number") {
      if (
        !Number.isInteger(templateIndex) ||
        templateIndex < 0 ||
        templateIndex >= WEEK_TEMPLATES.length
      ) {
        return NextResponse.json({ error: "Invalid template" }, { status: 400 });
      }
      newTemplateIndex = templateIndex;
    } else {
      newTemplateIndex = nextTemplateIndex(existing.templateIndex);
    }

    const currentWeekOf = getWeekStart();
    const fresh = createWeekDocument(newTemplateIndex, currentWeekOf, userId);
    const insertResult = await collection.insertOne(fresh);
    const inserted = { ...fresh, _id: insertResult.insertedId };

    return NextResponse.json({ week: serializeWeek(inserted) });
  } catch (error) {
    console.error("Failed to start new week", error);
    return NextResponse.json({ error: "Failed to start new week" }, { status: 500 });
  }
}
