import Link from "next/link";

import { getDb } from "@/lib/mongodb";
import { serializeWeek, type DayEntry, type WeekDocument } from "@/lib/week";

import type { WeekListEntry } from "@/app/workouts/types";

import { ProgressDashboard } from "./progress-dashboard";
import type { ProgressData, ProgressDayAverage, ProgressTotals, ProgressWeek } from "./types";

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
    } satisfies WeekListEntry;
  });
}

function countDaySets(day: DayEntry) {
  return day.exercises.reduce(
    (acc, exercise) => {
      const completedSets = exercise.sets.filter((set) => set.done).length;
      acc.completed += completedSets;
      acc.total += exercise.sets.length;
      return acc;
    },
    { completed: 0, total: 0 }
  );
}

function formatWeekLabel(weekOf: string) {
  const baseDate = new Date(`${weekOf}T00:00:00.000Z`);
  const short = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(baseDate);
  const long = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(baseDate);

  return { label: short, longLabel: `Week of ${long}` };
}

function buildProgressData(weeks: WeekListEntry[]): ProgressData {
  if (weeks.length === 0) {
    return {
      weeks: [],
      totals: {
        completed: 0,
        total: 0,
        weekCount: 0,
        dayCount: 0,
        averageCompletion: 0
      },
      dayAverages: [],
      highlightWeekId: null,
      latestWeekId: null,
      currentStreak: 0
    };
  }

  const chronological = [...weeks].sort((a, b) => {
    return new Date(a.weekOf).getTime() - new Date(b.weekOf).getTime();
  });

  const progressWeeks: ProgressWeek[] = chronological.map((week) => {
    const daySummaries = week.days.map((day) => {
      const { completed, total } = countDaySets(day);
      return {
        id: day.id,
        name: day.name,
        shortName: day.shortName,
        completed,
        total
      };
    });

    const completed = daySummaries.reduce((acc, day) => acc + day.completed, 0);
    const total = daySummaries.reduce((acc, day) => acc + day.total, 0);
    const { label, longLabel } = formatWeekLabel(week.weekOf);

    return {
      id: week.id,
      weekOf: week.weekOf,
      label,
      longLabel,
      updatedAt: week.updatedAt,
      templateTitle: week.templateTitle,
      status: week.status,
      completed,
      total,
      completionRate: total > 0 ? completed / total : 0,
      days: daySummaries
    } satisfies ProgressWeek;
  });

  const totals: ProgressTotals = progressWeeks.reduce(
    (acc, week) => {
      acc.completed += week.completed;
      acc.total += week.total;
      acc.dayCount += week.days.length;
      return acc;
    },
    {
      completed: 0,
      total: 0,
      weekCount: progressWeeks.length,
      dayCount: 0,
      averageCompletion: 0
    }
  );

  totals.averageCompletion = totals.total > 0 ? totals.completed / totals.total : 0;

  const buckets = new Map<string, ProgressDayAverage>();

  progressWeeks.forEach((week) => {
    week.days.forEach((day, index) => {
      const key = `${index}-${day.name}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.completed += day.completed;
        existing.total += day.total;
      } else {
        buckets.set(key, {
          key,
          label: day.name,
          completed: day.completed,
          total: day.total,
          completionRate: 0,
          index
        });
      }
    });
  });

  const dayAverages: ProgressDayAverage[] = Array.from(buckets.values())
    .map((bucket) => ({
      ...bucket,
      completionRate: bucket.total > 0 ? bucket.completed / bucket.total : 0
    }))
    .sort((a, b) => a.index - b.index);

  const highlightWeek = [...progressWeeks]
    .sort((a, b) => {
      const rateDiff = b.completionRate - a.completionRate;
      if (rateDiff !== 0) {
        return rateDiff;
      }
      return new Date(b.weekOf).getTime() - new Date(a.weekOf).getTime();
    })
    .at(0);

  const latestWeek = progressWeeks.at(-1) ?? null;

  let streak = 0;
  for (let index = progressWeeks.length - 1; index >= 0; index -= 1) {
    const week = progressWeeks[index];
    if (week.completed > 0) {
      streak += 1;
    } else {
      break;
    }
  }

  return {
    weeks: progressWeeks,
    totals,
    dayAverages,
    highlightWeekId: highlightWeek?.id ?? null,
    latestWeekId: latestWeek?.id ?? null,
    currentStreak: streak
  };
}

export default async function ProgressPage() {
  let weeks: WeekListEntry[] = [];
  let loadError: string | null = null;

  try {
    weeks = await fetchWeeks();
  } catch (error) {
    console.error("Failed to load workouts for progress dashboard", error);
    loadError = "We couldn’t load your history. Check the database connection and try again.";
  }

  const progressData: ProgressData = buildProgressData(weeks);

  return (
    <div className="progress-page">
      <div className="wrap progress-wrap">
        <header className="hero hero-compact progress-hero">
          <div className="hero-heading progress-hero__heading">
            <p className="eyebrow">Fitmotion Insights</p>
            <h1>Progress Dashboard</h1>
            <p className="hero-sub">
              Visualize completion trends, celebrate streaks, and spot the weeks that delivered the
              biggest wins.
            </p>
          </div>
          <div className="hero-actions progress-hero__actions">
            <Link className="btn ghost" href="/">
              ← Back to tracker
            </Link>
            <Link className="btn ghost" href="/workouts">
              Saved weeks
            </Link>
          </div>
        </header>

        {loadError ? (
          <div className="banner error">
            <span>{loadError}</span>
          </div>
        ) : progressData.weeks.length === 0 ? (
          <div className="card progress-empty">
            <h2>No workouts logged yet</h2>
            <p className="muted">
              Start a week in the tracker and save your sets to unlock personalized visualizations of
              your progress.
            </p>
            <div className="progress-empty__actions">
              <Link className="btn" href="/">
                Go to tracker
              </Link>
              <Link className="btn ghost" href="/auth">
                Log in / Register
              </Link>
            </div>
          </div>
        ) : (
          <ProgressDashboard data={progressData} />
        )}
      </div>
    </div>
  );
}
