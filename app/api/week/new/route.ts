import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, days, templateIndex } = body as {
      id?: string;
      days?: WeekDocument["days"];
      templateIndex?: number;
    };

    if (!id || !Array.isArray(days)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection<WeekDocument>("weeks");
    const objectId = new ObjectId(id);
    const existing = await collection.findOne({ _id: objectId, status: "active" });

    if (!existing) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    await collection.updateOne(
      { _id: objectId },
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
    const fresh = createWeekDocument(newTemplateIndex, currentWeekOf);
    const insertResult = await collection.insertOne(fresh);
    const inserted = { ...fresh, _id: insertResult.insertedId };

    return NextResponse.json({ week: serializeWeek(inserted) });
  } catch (error) {
    console.error("Failed to start new week", error);
    return NextResponse.json({ error: "Failed to start new week" }, { status: 500 });
  }
}
