import Link from "next/link";

import { getDb } from "@/lib/mongodb";
import { serializeWeek, type WeekDocument } from "@/lib/week";

import { ArchiveViewer } from "./archive-viewer";
import type { WeekListEntry } from "./types";

export const dynamic = "force-dynamic";

async function fetchWeeks(): Promise<WeekListEntry[]> {
  const db = await getDb();
  const collection = db.collection<WeekDocument>("weeks");
  const documents = await collection
    .find({}, { sort: { createdAt: -1 } })
    .toArray();

  return documents.map((doc) => {
    const serialized = serializeWeek(doc);
    return {
      ...serialized,
      status: doc.status,
      archivedAt: doc.archivedAt ? doc.archivedAt.toISOString() : null
    };
  });
}

export default async function WorkoutsPage() {
  let weeks: WeekListEntry[] = [];
  let loadError: string | null = null;

  try {
    weeks = await fetchWeeks();
  } catch (error) {
    console.error("Failed to load saved workouts", error);
    loadError = "We couldn’t load your saved workouts. Check your database connection and try again.";
  }

  return (
    <div className="archive-page">
      <div className="wrap archive-wrap">
        <header className="hero hero-compact archive-hero">
          <div className="hero-heading archive-hero__heading">
            <p className="eyebrow">Fitmotion Archive</p>
            <h1>Saved Workouts</h1>
            <p className="hero-sub">
              Browse the weeks you’ve logged, keep tabs on progress, and share highlights anytime.
            </p>
          </div>
          <div className="hero-actions">
            <Link className="btn ghost" href="/">
              ← Back to tracker
            </Link>
          </div>
        </header>

        {loadError ? (
          <div className="banner error">
            <span>{loadError}</span>
          </div>
        ) : weeks.length === 0 ? (
          <div className="card">
            <h2>No workouts saved yet</h2>
            <p className="muted">
              Once you log sets on the tracker, they’ll appear here so you can review or export past weeks.
            </p>
          </div>
        ) : (
          <ArchiveViewer weeks={weeks} />
        )}
      </div>
    </div>
  );
}
