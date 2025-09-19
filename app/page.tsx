"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import type { DayEntry, WeekResponse } from "@/lib/week";

type SaveState = "idle" | "saving" | "saved" | "error";

const ACTIVE_DAY_STORAGE_KEY = "rpe6_active_day";

type FieldKey = "weight" | "repsOrSec" | "rpe" | "done";

type PlanOption = {
  value: number;
  key: string;
  label: string;
};

const PLAN_OPTIONS: PlanOption[] = [
  { value: 0, key: "foundation", label: "Beginner" },
  { value: 1, key: "athletic", label: "Intermediate" },
  { value: 2, key: "apex", label: "Advanced" }
];

type ConfirmState = {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatStatus(state: SaveState) {
  switch (state) {
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "error":
      return "Save failed";
    default:
      return "Ready";
  }
}

function getStatusClass(state: SaveState) {
  switch (state) {
    case "saving":
      return "status-indicator saving";
    case "saved":
      return "status-indicator saved";
    case "error":
      return "status-indicator error";
    default:
      return "status-indicator";
  }
}

function getDayTotals(day: DayEntry) {
  return day.exercises.reduce(
    (acc, exercise) => {
      const doneSets = exercise.sets.filter((set) => set.done).length;
      acc.completed += doneSets;
      acc.total += exercise.sets.length;
      return acc;
    },
    { completed: 0, total: 0 }
  );
}

function collectUnique(values: string[]) {
  const trimmed = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return Array.from(new Set(trimmed));
}

function buildWeekShareSummary(week: WeekResponse) {
  let aggregateCompleted = 0;
  let aggregateTotal = 0;

  week.days.forEach((day) => {
    const { completed, total } = getDayTotals(day);
    aggregateCompleted += completed;
    aggregateTotal += total;
  });

  const lines: string[] = [
    `Fitmotion · Week of ${week.weekOf}`,
    `${week.templateTitle} — ${week.description}`,
    `Progress: ${aggregateCompleted}/${aggregateTotal} sets complete`,
    ""
  ];

  week.days.forEach((day) => {
    const { completed, total } = getDayTotals(day);
    lines.push(`${day.name}: ${completed}/${total} sets complete`);

    day.exercises.forEach((exercise) => {
      const doneSets = exercise.sets.filter((set) => set.done).length;
      const weights = collectUnique(exercise.sets.map((set) => set.weight));
      const repsOrSeconds = collectUnique(exercise.sets.map((set) => set.repsOrSec));
      const rpes = collectUnique(exercise.sets.map((set) => set.rpe));
      const detailParts: string[] = [];

      if (weights.length > 0) {
        detailParts.push(`wt ${weights.join("/")}`);
      }
      if (repsOrSeconds.length > 0) {
        detailParts.push(`${exercise.type === "seconds" ? "sec" : "reps"} ${repsOrSeconds.join("/")}`);
      }
      if (rpes.length > 0) {
        detailParts.push(`RPE ${rpes.join("/")}`);
      }
      detailParts.push(`${doneSets}/${exercise.sets.length} done`);

      lines.push(`  • ${exercise.name}: ${detailParts.join(" · ")}`);
    });

    lines.push("");
  });

  lines.push("Shared from Fitmotion Trainer");

  return lines.join("\n").trim();
}

async function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error("Clipboard API failed", error);
    }
  }

  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch (error) {
      console.error("execCommand copy failed", error);
    }
  }

  return false;
}

export default function HomePage() {
  const [week, setWeek] = useState<WeekResponse | null>(null);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [newWeekLoading, setNewWeekLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    let isMounted = true;

    async function loadWeek() {
      try {
        setLoading(true);
        const response = await fetch("/api/week", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = (await response.json()) as { week: WeekResponse };
        if (!isMounted) return;
        pendingRef.current = false;
        initialLoadRef.current = true;
        setWeek(data.week);
        setSelectedPlanIndex(data.week.templateIndex);
        setSaveState("saved");
        setError(null);
        setNotice(null);
        setConfirmState(null);
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        setError("Unable to load workouts. Check your connection and try again.");
        setNotice(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadWeek();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (week) {
      setSelectedPlanIndex(week.templateIndex);
    }
  }, [week]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(ACTIVE_DAY_STORAGE_KEY);
    if (stored) {
      const parsed = Number.parseInt(stored, 10);
      if (!Number.isNaN(parsed)) {
        setActiveDayIndex(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACTIVE_DAY_STORAGE_KEY, String(activeDayIndex));
  }, [activeDayIndex]);

  useEffect(() => {
    if (!week) return;
    if (activeDayIndex >= week.days.length) {
      setActiveDayIndex(0);
    }
  }, [week, activeDayIndex]);

  useEffect(() => {
    if (!week) return;
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    if (!pendingRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveState("saving");

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/week", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: week.id, days: week.days })
        });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        pendingRef.current = false;
        setSaveState("saved");
      } catch (err) {
        console.error(err);
        setSaveState("error");
      }
    }, 600);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [week]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const activeDay: DayEntry | undefined = useMemo(() => {
    if (!week) return undefined;
    return week.days[activeDayIndex] ?? week.days[0];
  }, [week, activeDayIndex]);

  const currentPlanOption = useMemo(() => {
    const planIndex = week?.templateIndex ?? 0;
    return PLAN_OPTIONS.find((option) => option.value === planIndex) ?? PLAN_OPTIONS[0];
  }, [week?.templateIndex]);

  function markPending() {
    pendingRef.current = true;
    setSaveState("saving");
    setNotice(null);
    setConfirmState(null);
  }

  function dismissError() {
    setError(null);
  }

  function dismissNotice() {
    setNotice(null);
  }

  function cancelConfirm() {
    setConfirmState(null);
    if (week) {
      setSelectedPlanIndex(week.templateIndex);
    }
  }

  function updateSet(
    dayIndex: number,
    exerciseIndex: number,
    setIndex: number,
    field: FieldKey,
    value: string | boolean
  ) {
    setWeek((prev) => {
      if (!prev) return prev;
      const days = prev.days.map((day, dIdx) => {
        if (dIdx !== dayIndex) return day;
        const exercises = day.exercises.map((exercise, eIdx) => {
          if (eIdx !== exerciseIndex) return exercise;
          const sets = exercise.sets.map((set, sIdx) => {
            if (sIdx !== setIndex) return set;
            if (field === "done") {
              return { ...set, done: Boolean(value) };
            }
            if (field === "rpe") {
              return { ...set, rpe: String(value) };
            }
            if (field === "weight") {
              return { ...set, weight: String(value) };
            }
            return { ...set, repsOrSec: String(value) };
          });
          return { ...exercise, sets };
        });
        return { ...day, exercises };
      });
      return { ...prev, days };
    });
    markPending();
  }

  function resetDay(dayIndex: number, dayName: string) {
    setWeek((prev) => {
      if (!prev) return prev;
      const days = prev.days.map((day, dIdx) => {
        if (dIdx !== dayIndex) return day;
        const exercises = day.exercises.map((exercise) => ({
          ...exercise,
          sets: exercise.sets.map((set) => ({
            ...set,
            weight: "",
            repsOrSec: "",
            rpe: "",
            done: false
          }))
        }));
        return { ...day, exercises };
      });
      return { ...prev, days };
    });
    markPending();
    setNotice(`${dayName} cleared.`);
  }

  function handleResetDay() {
    if (!week) return;
    const targetDay = week.days[activeDayIndex];
    if (!targetDay) return;
    setConfirmState({
      message: `Clear entries for ${targetDay.name}?`,
      confirmLabel: "Clear day",
      onConfirm: () => {
        setConfirmState(null);
        resetDay(activeDayIndex, targetDay.name);
      }
    });
  }

  async function startNewWeek(currentWeek: WeekResponse, templateIndex?: number, successMessage?: string) {
    try {
      setNewWeekLoading(true);
      setNotice(null);
      setSaveState("saving");
      setError(null);
      const payload: {
        id: string;
        days: WeekResponse["days"];
        templateIndex?: number;
      } = {
        id: currentWeek.id,
        days: currentWeek.days
      };

      if (typeof templateIndex === "number") {
        payload.templateIndex = templateIndex;
      }

      const response = await fetch("/api/week/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = (await response.json()) as { week: WeekResponse };
      pendingRef.current = false;
      initialLoadRef.current = true;
      setWeek(data.week);
      setSelectedPlanIndex(data.week.templateIndex);
      setActiveDayIndex(0);
      setSaveState("saved");
      setError(null);
      setNotice(successMessage ?? "New week loaded. Your previous week was archived.");
    } catch (err) {
      console.error(err);
      setError("Unable to start a new week. Please try again.");
      setSaveState("error");
      setNotice(null);
      if (typeof templateIndex === "number") {
        setSelectedPlanIndex(currentWeek.templateIndex);
      }
    } finally {
      setNewWeekLoading(false);
    }
  }

  function handleNewWeek() {
    if (!week) return;
    if (newWeekLoading) return;
    const currentWeek = week;
    setConfirmState({
      message: "Archive current week and start a new one?",
      confirmLabel: "Start new week",
      onConfirm: () => {
        setConfirmState(null);
        void startNewWeek(currentWeek);
      }
    });
  }

  function handlePlanSelect(event: ChangeEvent<HTMLSelectElement>) {
    if (!week) return;
    const nextIndex = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(nextIndex)) {
      return;
    }
    setSelectedPlanIndex(nextIndex);
    if (nextIndex === week.templateIndex) {
      setConfirmState(null);
      return;
    }

    const option = PLAN_OPTIONS.find((item) => item.value === nextIndex);

    setConfirmState({
      message: option
        ? `Switch to the ${option.label} plan? Your current week will be archived.`
        : "Switch to the selected plan? Your current week will be archived.",
      confirmLabel: "Switch plan",
      onConfirm: () => {
        setConfirmState(null);
        void startNewWeek(
          week,
          nextIndex,
          option ? `${option.label} plan ready. Your previous week was archived.` : undefined
        );
      }
    });
  }

  async function handleShare() {
    if (!week) return;

    setNotice(null);

    const summary = buildWeekShareSummary(week);

    if (typeof navigator !== "undefined" && "share" in navigator) {
      const shareNavigator = navigator as Navigator & {
        share: (data: ShareData) => Promise<void>;
        canShare?: (data: ShareData) => boolean;
      };

      const shareData: ShareData = {
        title: `Fitmotion · Week of ${week.weekOf}`,
        text: summary
      };

      try {
        if (!shareNavigator.canShare || shareNavigator.canShare(shareData)) {
          await shareNavigator.share(shareData);
          setNotice("Share sheet opened — send it to complete.");
          return;
        }
      } catch (error) {
        const domError = error as DOMException | undefined;
        if (domError?.name === "AbortError") {
          return;
        }
        console.error("Share failed", error);
      }
    }

    const copied = await copyToClipboard(summary);

    if (copied) {
      setNotice("Week summary copied. Paste it anywhere to share.");
      return;
    }

    setError("Sharing isn't supported in this browser. Try copying your progress manually.");
  }

  if (loading && !week) {
    return (
      <div className="wrap">
        <p>Loading plan…</p>
      </div>
    );
  }

  if (!week) {
    return (
      <div className="wrap">
        <header className="hero home-hero">
          <div className="home-hero__header">
            <div className="home-hero__brand">
              <p className="eyebrow">Fitmotion Trainer</p>
              <h1>Weekly Workouts</h1>
            </div>
          </div>
          <p className="home-hero__description">We couldn’t load your workouts.</p>
        </header>
        {error && (
          <div className="banner error">
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wrap">
      <header className="hero home-hero">
        <div className="home-hero__header">
          <div className="home-hero__brand">
            <p className="eyebrow">Fitmotion Trainer</p>
            <h1>Weekly Workouts</h1>
          </div>
          <Link className="btn ghost home-hero__link" href="/workouts">
            View saved weeks
          </Link>
        </div>
        <div className="home-hero__controls">
          <label className="home-field" htmlFor="plan-level">
            <span>Level</span>
            <select
              className="in"
              id="plan-level"
              onChange={handlePlanSelect}
              value={String(selectedPlanIndex)}
              disabled={newWeekLoading}
            >
              {PLAN_OPTIONS.map((option) => (
                <option key={option.value} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="home-hero__meta">
            <span className="home-pill">{currentPlanOption.label} plan</span>
            <span className="home-pill">{week.templateTitle}</span>
          </div>
        </div>
        <p className="home-hero__description">{week.description}</p>
      </header>

      {error && (
        <div className="banner error">
          <span>
            <strong>Error:</strong> {error}
          </span>
          <button className="btn ghost" onClick={dismissError} type="button">
            Dismiss
          </button>
        </div>
      )}

      {notice && (
        <div className="banner success">
          <span>{notice}</span>
          <button className="btn ghost" onClick={dismissNotice} type="button">
            Dismiss
          </button>
        </div>
      )}

      {confirmState && (
        <div className="confirm-banner">
          <span>{confirmState.message}</span>
          <div className="confirm-actions">
            <button className="btn warn" onClick={confirmState.onConfirm} type="button">
              {confirmState.confirmLabel ?? "Confirm"}
            </button>
            <button className="btn ghost" onClick={cancelConfirm} type="button">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="sticky-actions">
        <div className="topbar">
          <div className="tab-group">
            {week.days.map((day, idx) => (
              <button
                key={day.id}
                className={classNames("pill", idx === activeDayIndex && "active")}
                onClick={() => setActiveDayIndex(idx)}
                title={day.name}
                type="button"
              >
                {day.shortName}
              </button>
            ))}
            <span className="pill">Week of {week.weekOf}</span>
          </div>
          <span className="spacer" />
          <span className={getStatusClass(saveState)}>{formatStatus(saveState)}</span>
          <button
            className="btn"
            onClick={() => {
              void handleShare();
            }}
            type="button"
            title="Share a summary of your progress"
          >
            <span aria-hidden>📤</span>
            <span className="btn-label">Share</span>
          </button>
          <button
            className="btn warn"
            onClick={handleNewWeek}
            type="button"
            title="Archive current data and start fresh"
            disabled={newWeekLoading}
          >
            {newWeekLoading ? "⏳ Loading…" : "🗓️ New Week"}
          </button>
          <button
            className="btn danger"
            onClick={handleResetDay}
            type="button"
            title="Clear the current day only"
          >
            ♻️ Reset Day
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Today’s Plan</h2>
          {!activeDay ? (
            <p>No day selected.</p>
          ) : (
            <div>
              {activeDay.exercises.map((exercise, exerciseIndex) => (
                <div className="exercise" key={`${exercise.name}-${exerciseIndex}`}>
                  <header>
                    <h3>
                      {exercise.name}{" "}
                      <span className="muted small">({exercise.target})</span>
                    </h3>
                  </header>
                  <details className="how">
                    <summary>Form cues</summary>
                    <p>{exercise.how}</p>
                  </details>
                  <div className="sets">
                    <table>
                      <thead>
                        <tr>
                          <th>Set</th>
                          <th>Weight</th>
                          <th>{exercise.type === "seconds" ? "Seconds" : "Reps"}</th>
                          <th>RPE</th>
                          <th>Done</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exercise.sets.map((set, setIndex) => (
                          <tr key={`${exercise.name}-${setIndex}`} className={set.done ? "done" : undefined}>
                            <td>{set.set}</td>
                            <td>
                              <input
                                className="in"
                                type="text"
                                inputMode="decimal"
                                placeholder="lbs"
                                value={set.weight}
                                onChange={(event) =>
                                  updateSet(activeDayIndex, exerciseIndex, setIndex, "weight", event.target.value)
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="in"
                                type="text"
                                inputMode="numeric"
                                placeholder={exercise.type === "seconds" ? "sec" : "reps"}
                                value={set.repsOrSec}
                                onChange={(event) =>
                                  updateSet(activeDayIndex, exerciseIndex, setIndex, "repsOrSec", event.target.value)
                                }
                              />
                            </td>
                            <td>
                              <select
                                className="in"
                                value={set.rpe}
                                onChange={(event) =>
                                  updateSet(activeDayIndex, exerciseIndex, setIndex, "rpe", event.target.value)
                                }
                              >
                                <option value="">--</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                                <option value="7">7</option>
                                <option value="8">8</option>
                              </select>
                            </td>
                            <td>
                              <input
                                className="chk"
                                type="checkbox"
                                checked={set.done}
                                onChange={(event) =>
                                  updateSet(activeDayIndex, exerciseIndex, setIndex, "done", event.target.checked)
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card guide-card">
          <h2>Quick tips</h2>
          <ul className="guide-list">
            <li>Pick a day, log your sets, and check them off as you go.</li>
            <li>Use the Share button 📤 to send the week anywhere.</li>
            <li>Keep reps smooth with 3–4 in the tank—then load up next time.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
