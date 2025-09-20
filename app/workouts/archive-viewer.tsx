"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { DayEntry } from "@/lib/week";

import type { WeekListEntry } from "./types";

type ArchiveViewerProps = {
  weeks: WeekListEntry[];
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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

function countWeekSets(week: WeekListEntry) {
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

function describeStatus(week: WeekListEntry) {
  if (week.status === "active") {
    return "Active week";
  }

  if (week.archivedAt) {
    return `Archived · ${formatDateTime(week.archivedAt)}`;
  }

  return "Archived";
}

export function ArchiveViewer({ weeks }: ArchiveViewerProps) {
  const defaultWeekId = useMemo(() => {
    const activeWeek = weeks.find((week) => week.status === "active");
    return activeWeek?.id ?? weeks[0]?.id ?? null;
  }, [weeks]);

  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(defaultWeekId);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedWeekId((previous) => {
      if (previous && weeks.some((week) => week.id === previous)) {
        return previous;
      }
      return defaultWeekId;
    });
  }, [weeks, defaultWeekId]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointer(event: MouseEvent | TouchEvent) {
      if (!menuRef.current) {
        return;
      }
      if (event.target instanceof Node && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  const selectedWeek = useMemo(
    () => weeks.find((week) => week.id === selectedWeekId) ?? weeks[0] ?? null,
    [weeks, selectedWeekId]
  );

  if (!selectedWeek) {
    return null;
  }

  const { completed, total } = countWeekSets(selectedWeek);
  const formattedWeek = formatWeekOf(selectedWeek.weekOf);
  const selectedIndex = weeks.findIndex((week) => week.id === selectedWeek.id);
  const hasMultipleWeeks = weeks.length > 1;

  return (
    <div className="archive-viewer">
      <div className="archive-toolbar">
        <div className="archive-picker" ref={menuRef}>
          <button
            aria-controls="archive-week-menu"
            aria-expanded={menuOpen && hasMultipleWeeks}
            aria-haspopup="listbox"
            className="archive-picker__button"
            disabled={!hasMultipleWeeks}
            onClick={() => {
              if (hasMultipleWeeks) {
                setMenuOpen((open) => !open);
              }
            }}
            type="button"
          >
            <span className="archive-picker__text">
              <span className="archive-picker__eyebrow">
                {selectedWeek.status === "active" ? "Active week" : "Saved week"}
              </span>
              <span className="archive-picker__value">Week of {formattedWeek}</span>
            </span>
            {hasMultipleWeeks && (
              <svg
                aria-hidden="true"
                className={cx("archive-picker__icon", menuOpen && "open")}
                focusable="false"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5.25 7.5L10 12.25L14.75 7.5H5.25Z" fill="currentColor" />
              </svg>
            )}
          </button>
          {menuOpen && hasMultipleWeeks && (
            <ul
              aria-label="Saved weeks"
              className="archive-picker__menu"
              id="archive-week-menu"
              role="listbox"
            >
              {weeks.map((week) => {
                const isSelected = week.id === selectedWeek.id;
                return (
                  <li key={week.id}>
                    <button
                      aria-selected={isSelected}
                      className={cx("archive-picker__option", isSelected && "selected")}
                      onClick={() => {
                        setSelectedWeekId(week.id);
                        setMenuOpen(false);
                      }}
                      role="option"
                      type="button"
                    >
                      <span className="archive-picker__option-week">
                        Week of {formatWeekOf(week.weekOf)}
                      </span>
                      <span className="archive-picker__option-meta">{describeStatus(week)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <p className="archive-count" role="status">
          Viewing {selectedIndex + 1} of {weeks.length} saved week{weeks.length === 1 ? "" : "s"}.
        </p>
      </div>

      <article className="card workout-card">
        <div className="workout-header">
          <div>
            <h2>Week of {formattedWeek}</h2>
            <ul className="workout-summary-grid">
              <li className="summary-item">
                <span className="summary-label">Days logged</span>
                <span className="summary-value-row">
                  <span className="summary-value">{selectedWeek.days.length}</span>
                  <span className="summary-subvalue">
                    day{selectedWeek.days.length === 1 ? "" : "s"}
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
                  {formatDateTime(selectedWeek.updatedAt)}
                </span>
              </li>
            </ul>
          </div>
          <div className="workout-tags">
            <span className="pill template-pill" title={selectedWeek.description}>
              {selectedWeek.templateTitle}
            </span>
            <span
              className={cx(
                "pill",
                selectedWeek.status === "active" ? "pill-active" : "pill-archived"
              )}
            >
              {describeStatus(selectedWeek)}
            </span>
          </div>
        </div>

        <div
          aria-label={`Days logged for the week of ${formattedWeek}`}
          className="day-carousel"
        >
          <div className="day-track">
            {selectedWeek.days.map((day) => {
              const { completed: dayCompleted, total: dayTotal } = countDaySets(day);

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
                        {exercise.suggestedWeight && (
                          <div className="exercise-summary-suggested">
                            Suggested: {exercise.suggestedWeight}
                          </div>
                        )}
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
    </div>
  );
}
