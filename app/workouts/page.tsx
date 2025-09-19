import Link from "next/link";

import { getDb } from "@/lib/mongodb";
import { serializeWeek, type DayEntry, type WeekDocument, type WeekResponse } from "@/lib/week";

export const dynamic = "force-dynamic";

type WeekListEntry = WeekResponse & {
  status: WeekDocument["status"];
  archivedAt: string | null;
};

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(iso));
}

function formatWeekOf(weekOf: string) {
  const date = new Date(`${weekOf}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(date);
}

function countDaySets(day: DayEntry) {
  return day.exercises.reduce(
    (acc, exercise) => {
      acc.total += exercise.sets.length;
      acc.completed += exercise.sets.filter((set) => set.done).length;
      return acc;
    },
    { completed: 0, total: 0 }
  );
}

function countWeekSets(week: WeekResponse) {
  return week.days.reduce(
    (acc, day) => {
      const { completed, total } = countDaySets(day);
      acc.completed += completed;
      acc.total += total;
      return acc;
    },
    { completed: 0, total: 0 }
  );
}

async function fetchWeeks(): Promise<WeekListEntry[]> {
  const db = await getDb();
  const collection = db.collection<WeekDocument>("weeks");
  const documents = await collection
    .find({}, { sort: { createdAt: -1 } })
    .limit(24)
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
          <div className="workout-list">
            {weeks.map((week) => {
              const { completed, total } = countWeekSets(week);
              const isActive = week.status === "active";
              const formattedWeek = formatWeekOf(week.weekOf);

              return (
                <article className="card workout-card" key={week.id}>
                  <div className="workout-header">
                    <div>
                      <h2>Week of {formattedWeek}</h2>
                      <ul className="workout-summary-grid">
                        <li className="summary-item">
                          <span className="summary-label">Days logged</span>
                          <span className="summary-value-row">
                            <span className="summary-value">{week.days.length}</span>
                            <span className="summary-subvalue">
                              day{week.days.length === 1 ? "" : "s"}
                            </span>
                          </span>
                        </li>
                        <li className="summary-item">
                          <span className="summary-label">Sets complete</span>
                          <span className="summary-value-row">
                            <span className="summary-value">{completed}</span>
                            <span className="summary-subvalue">of {total}</span>
                          </span>
                        </li>
                        <li className="summary-item">
                          <span className="summary-label">Last updated</span>
                          <span className="summary-value summary-value-compact">
                            {formatDateTime(week.updatedAt)}
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="workout-tags">
                      <span className="pill template-pill" title={week.description}>
                        {week.templateTitle}
                      </span>
                      <span className={`pill ${isActive ? "pill-active" : "pill-archived"}`}>
                        {isActive
                          ? "Active week"
                          : week.archivedAt
                            ? `Archived · ${formatDateTime(week.archivedAt)}`
                            : "Archived"}
                      </span>
                    </div>
                  </div>

                  <div
                    aria-label={`Days logged for the week of ${formattedWeek}`}
                    className="day-carousel"
                  >
                    <div className="day-track">
                      {week.days.map((day) => {
                        const { completed: dayCompleted, total: dayTotal } =
                          countDaySets(day);

                        return (
                          <section className="day-card" key={day.id}>
                            <div className="day-header">
                              <h3>{day.name}</h3>
                              <div className="day-meta">
                                {day.shortName} • {dayCompleted}/{dayTotal} sets complete
                              </div>
                            </div>

                            {day.exercises.map((exercise) => {
                              const exerciseKey = `${day.id}-${exercise.name}`;
                              const exerciseCompleted = exercise.sets.filter((set) => set.done).length;

                              return (
                                <div className="exercise-summary" key={exerciseKey}>
                                  <div className="exercise-summary-title">
                                    <span>{exercise.name}</span>
                                    <span className="muted small">({exercise.target})</span>
                                  </div>
                                  <div className="exercise-summary-how">{exercise.how}</div>
                                  <div className="exercise-table-wrap">
                                    <table className="exercise-table">
                                      <thead>
                                        <tr>
                                          <th scope="col">Set</th>
                                          <th scope="col">Weight</th>
                                          <th scope="col">
                                            {exercise.type === "seconds" ? "Seconds" : "Reps"}
                                          </th>
                                          <th scope="col">RPE</th>
                                          <th scope="col">Done</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {exercise.sets.map((set) => (
                                          <tr key={`${exerciseKey}-${set.set}`}>
                                            <td>{set.set}</td>
                                            <td>{set.weight || "—"}</td>
                                            <td>{set.repsOrSec || "—"}</td>
                                            <td>{set.rpe || "—"}</td>
                                            <td>{set.done ? "✅" : "—"}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <div className="exercise-summary-footer">
                                    {exerciseCompleted}/{exercise.sets.length} sets complete
                                  </div>
                                </div>
                              );
                            })}
                          </section>
                        );
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
