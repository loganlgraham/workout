import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { createWeekDocument, serializeWeek, type WeekDocument } from "@/lib/week";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const collection = db.collection<WeekDocument>("weeks");
    const active = await collection.findOne({ status: "active" }, { sort: { createdAt: -1 } });

    if (active) {
      return NextResponse.json({ week: serializeWeek(active) });
    }

    const fresh = createWeekDocument(0);
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
    const { id, days } = body as { id?: string; days?: WeekDocument["days"] };

    if (!id || !Array.isArray(days)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection<WeekDocument>("weeks");
    const objectId = new ObjectId(id);

    const result = await collection.updateOne(
      { _id: objectId, status: "active" },
      { $set: { days, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update week", error);
    return NextResponse.json({ error: "Failed to update week" }, { status: 500 });
  }
}
