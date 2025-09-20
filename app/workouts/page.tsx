import Link from "next/link";
import { ObjectId, type Filter } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { dedupeWeeksByStart, serializeWeek, type WeekDocument } from "@/lib/week";

import { ArchiveViewer } from "./archive-viewer";
import type { WeekListEntry } from "./types";

export const dynamic = "force-dynamic";

function buildUserFilter(userId?: string | null): Filter<WeekDocument> {
  if (!userId) {
    return { $or: [{ userId: { $exists: false } }, { userId: null }] };
  }

  const trimmed = userId.trim();

  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return { $or: [{ userId: { $exists: false } }, { userId: null }] };
  }

  if (!ObjectId.isValid(trimmed)) {
    throw new Error("Invalid user id");
  }

  return { userId: new ObjectId(trimmed) };
}

async function fetchWeeks(userId?: string | null): Promise<WeekListEntry[]> {
  const db = await getDb();
  const collection = db.collection<WeekDocument>("weeks");
  const documents = await collection
    .find(buildUserFilter(userId), { sort: { createdAt: -1 } })
    .toArray();

  const mapped = documents.map((doc) => {
    const serialized = serializeWeek(doc);
    return {
      ...serialized,
      status: doc.status,
      archivedAt: doc.archivedAt ? doc.archivedAt.toISOString() : null
    };
  });

  return dedupeWeeksByStart(mapped);
}

type WorkoutsPageProps = {
  searchParams?: {
    userId?: string;
  };
};

export default async function WorkoutsPage({ searchParams }: WorkoutsPageProps) {
  const requestedUserId = searchParams?.userId ?? null;
  const normalizedUserId = requestedUserId
    ? (() => {
        const trimmed = requestedUserId.trim();
        if (!trimmed || trimmed === "null" || trimmed === "undefined") {
          return null;
        }
        return trimmed;
      })()
    : null;
  let weeks: WeekListEntry[] = [];
  let loadError: string | null = null;

  try {
    weeks = await fetchWeeks(normalizedUserId);
  } catch (error) {
    console.error("Failed to load saved workouts", error);
    if (error instanceof Error && error.message === "Invalid user id") {
      loadError = "We couldn’t load your saved workouts. Please sign in and try again.";
    } else {
      loadError = "We couldn’t load your saved workouts. Check your database connection and try again.";
    }
  }

  const ownerIdForLinks =
    loadError === null ? weeks[0]?.userId ?? normalizedUserId ?? null : null;
  const progressHref = ownerIdForLinks
    ? `/progress?userId=${encodeURIComponent(ownerIdForLinks)}`
    : "/progress";

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
            <Link className="btn ghost" href={progressHref}>
              <span>Progress insights</span>
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.5 13.5 7.75 9.25 11 12.5 16.5 7"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
                <path
                  d="M16.5 11V7h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
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
