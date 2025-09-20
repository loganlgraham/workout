"use client";

import { useEffect, useId, useMemo, useState } from "react";

import type { ProgressData, ProgressWeek } from "./types";

function clampRate(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function formatPercent(value: number) {
  return `${Math.round(clampRate(value) * 100)}%`;
}

type LineChartPoint = {
  label: string;
  value: number;
  detail: string;
};

type LineChartGeometry = {
  width: number;
  height: number;
  path: string;
  area: string;
  coords: Array<{ x: number; y: number; point: LineChartPoint }>;
  baseline: number;
  paddingX: number;
  paddingY: number;
  gridLines: Array<{ y: number; label: string; isZero: boolean }>;
};

function useLineChartGeometry(points: LineChartPoint[]): LineChartGeometry {
  return useMemo(() => {
    const width = 680;
    const height = 260;
    const paddingX = 40;
    const paddingY = 32;
    const innerWidth = width - paddingX * 2;
    const innerHeight = height - paddingY * 2;
    const baseline = height - paddingY;
    const step = points.length > 1 ? innerWidth / (points.length - 1) : 0;

    const coords = points.map((point, index) => {
      const value = clampRate(point.value);
      const x =
        points.length > 1 ? paddingX + step * index : paddingX + innerWidth / 2;
      const y = paddingY + innerHeight * (1 - value);
      return { x, y, point };
    });

    const path = coords
      .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x} ${coord.y}`)
      .join(" ");

    const area =
      coords.length > 0
        ? `${path} L ${coords[coords.length - 1].x} ${baseline} L ${coords[0].x} ${baseline} Z`
        : "";

    const levelValues = [1, 0.75, 0.5, 0.25, 0];
    const gridLines = levelValues.map((value) => ({
      y: paddingY + innerHeight * (1 - value),
      label: `${Math.round(value * 100)}%`,
      isZero: value === 0
    }));

    return {
      width,
      height,
      path,
      area,
      coords,
      baseline,
      paddingX,
      paddingY,
      gridLines
    } satisfies LineChartGeometry;
  }, [points]);
}

function LineChart({ points }: { points: LineChartPoint[] }) {
  const geometry = useLineChartGeometry(points);
  const reactId = useId().replace(/:/g, "");
  const gradientId = `progress-line-${reactId}`;
  const areaId = `progress-line-area-${reactId}`;
  const chartId = `progress-line-chart-${reactId}`;
  const description = points
    .map((point) => `${point.label} ${point.detail}`)
    .join("; ");

  return (
    <div className="progress-line-chart">
      <svg
        aria-labelledby={`${chartId}-title ${chartId}-desc`}
        className="progress-line-chart__svg"
        role="img"
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      >
        <title id={`${chartId}-title`}>Weekly completion trend</title>
        <desc id={`${chartId}-desc`}>
          {description || "Completion data will appear after you log workouts."}
        </desc>
        <defs>
          <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-strong)" />
          </linearGradient>
          <linearGradient id={areaId} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(24, 214, 198, 0.28)" />
            <stop offset="100%" stopColor="rgba(24, 214, 198, 0.05)" />
          </linearGradient>
        </defs>
        {geometry.gridLines.map((line) => (
          <g key={line.label}>
            <line
              className={`progress-line-chart__grid-line${line.isZero ? " is-zero" : ""}`}
              x1={geometry.paddingX}
              x2={geometry.width - geometry.paddingX}
              y1={line.y}
              y2={line.y}
            />
            <text
              className="progress-line-chart__axis-label"
              x={geometry.paddingX - 12}
              y={line.y + 4}
            >
              {line.label}
            </text>
          </g>
        ))}
        {geometry.area && (
          <path className="progress-line-chart__area" d={geometry.area} fill={`url(#${areaId})`} />
        )}
        {geometry.path && (
          <path
            className="progress-line-chart__line"
            d={geometry.path}
            fill="none"
            stroke={`url(#${gradientId})`}
          />
        )}
        {geometry.coords.map(({ x, y, point }) => (
          <g key={`${point.label}-${x}`}> 
            <circle className="progress-line-chart__dot" cx={x} cy={y} r={6} />
            <text className="progress-line-chart__value" x={x} y={y - 12}>
              {point.detail}
            </text>
          </g>
        ))}
      </svg>
      <div className="progress-line-chart__labels" aria-hidden="true">
        {points.map((point) => (
          <span key={point.label}>
            <span className="progress-line-chart__label-value">{point.detail}</span>
            <span className="progress-line-chart__label-text">{point.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

type BarChartPoint = {
  label: string;
  value: number;
  detail: string;
};

type BarChartGeometry = {
  width: number;
  height: number;
  bars: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    point: BarChartPoint;
  }>;
  baseline: number;
  paddingX: number;
  paddingY: number;
};

function useBarChartGeometry(points: BarChartPoint[]): BarChartGeometry {
  return useMemo(() => {
    const width = 520;
    const height = 260;
    const paddingX = 44;
    const paddingY = 32;
    const innerWidth = width - paddingX * 2;
    const innerHeight = height - paddingY * 2;
    const baseline = height - paddingY;
    const barStep = points.length > 0 ? innerWidth / points.length : innerWidth;
    const barWidth = points.length > 0 ? Math.max(26, barStep * 0.55) : innerWidth * 0.6;

    const bars = points.map((point, index) => {
      const value = clampRate(point.value);
      const x = paddingX + index * barStep + (barStep - barWidth) / 2;
      const barHeight = innerHeight * value;
      const y = baseline - barHeight;
      return {
        x,
        y,
        width: barWidth,
        height: barHeight,
        point
      };
    });

    return {
      width,
      height,
      bars,
      baseline,
      paddingX,
      paddingY
    } satisfies BarChartGeometry;
  }, [points]);
}

function BarChart({ points }: { points: BarChartPoint[] }) {
  const geometry = useBarChartGeometry(points);
  const reactId = useId().replace(/:/g, "");
  const gradientId = `progress-bar-${reactId}`;
  const chartId = `progress-bar-chart-${reactId}`;
  const description = points
    .map((point) => `${point.label} ${point.detail}`)
    .join("; ");

  if (points.length === 0) {
    return <p className="progress-chart__empty">Log workouts to unlock day-by-day insights.</p>;
  }

  return (
    <div className="progress-bar-chart">
      <svg
        aria-labelledby={`${chartId}-title ${chartId}-desc`}
        className="progress-bar-chart__svg"
        role="img"
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      >
        <title id={`${chartId}-title`}>Average completion by training day</title>
        <desc id={`${chartId}-desc`}>
          {description || "Day averages will render after workouts are logged."}
        </desc>
        <defs>
          <linearGradient id={gradientId} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(24, 214, 198, 0.9)" />
            <stop offset="100%" stopColor="rgba(24, 214, 198, 0.35)" />
          </linearGradient>
        </defs>
        <line
          className="progress-bar-chart__baseline"
          x1={geometry.paddingX}
          x2={geometry.width - geometry.paddingX}
          y1={geometry.baseline}
          y2={geometry.baseline}
        />
        {geometry.bars.map(({ x, y, width, height, point }) => (
          <g key={`${point.label}-${x}`}>
            <rect
              className="progress-bar-chart__bar"
              fill={`url(#${gradientId})`}
              height={Math.max(height, 0)}
              rx={12}
              ry={12}
              width={width}
              x={x}
              y={y}
            />
            <text className="progress-bar-chart__value" x={x + width / 2} y={y - 10}>
              {point.detail}
            </text>
          </g>
        ))}
      </svg>
      <div className="progress-bar-chart__labels" aria-hidden="true">
        {points.map((point) => (
          <span key={point.label}>
            <span className="progress-bar-chart__label-value">{point.detail}</span>
            <span className="progress-bar-chart__label-text">{point.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

type RadialGaugeProps = {
  value: number;
  label: string;
  subLabel: string;
};

function RadialGauge({ value, label, subLabel }: RadialGaugeProps) {
  const reactId = useId().replace(/:/g, "");
  const gradientId = `progress-ring-gradient-${reactId}`;
  const chartId = `progress-ring-${reactId}`;
  const clamped = clampRate(value);
  const radius = 74;
  const strokeWidth = 13;
  const center = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div className="progress-ring">
      <svg
        aria-labelledby={`${chartId}-title ${chartId}-desc`}
        role="img"
        viewBox={`0 0 ${center * 2} ${center * 2}`}
      >
        <title id={`${chartId}-title`}>Week completion</title>
        <desc id={`${chartId}-desc`}>{label} of sets complete</desc>
        <defs>
          <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-strong)" />
          </linearGradient>
        </defs>
        <circle
          className="progress-ring__bg"
          cx={center}
          cy={center}
          fill="none"
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="progress-ring__value"
          cx={center}
          cy={center}
          fill="none"
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${center} ${center})`}
        />
        <text className="progress-ring__label" x={center} y={center - 4}>
          {label}
        </text>
        <text className="progress-ring__sub" x={center} y={center + 18}>
          {subLabel}
        </text>
      </svg>
    </div>
  );
}

function describeDelta(delta: number | null) {
  if (delta === null) {
    return { label: "First tracked week", tone: "neutral" as const };
  }

  const rounded = Math.round(delta * 100);

  if (rounded > 0) {
    return { label: `▲ ${rounded} pp vs prior week`, tone: "positive" as const };
  }

  if (rounded < 0) {
    return { label: `▼ ${Math.abs(rounded)} pp vs prior week`, tone: "negative" as const };
  }

  return { label: "No change vs prior week", tone: "neutral" as const };
}

export function ProgressDashboard({ data }: { data: ProgressData }) {
  const { weeks, totals, dayAverages, highlightWeekId, latestWeekId, currentStreak } = data;

  const fallbackWeekId = weeks.length > 0 ? weeks[weeks.length - 1].id : null;
  const initialSelectedId = latestWeekId ?? highlightWeekId ?? fallbackWeekId;
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(initialSelectedId);

  useEffect(() => {
    setSelectedWeekId((previous) => {
      if (previous && weeks.some((week) => week.id === previous)) {
        return previous;
      }
      const fallback = latestWeekId ?? highlightWeekId ?? (weeks.length > 0 ? weeks[weeks.length - 1].id : null);
      return fallback;
    });
  }, [weeks, latestWeekId, highlightWeekId]);

  const selectedWeek = useMemo(() => {
    if (weeks.length === 0) {
      return null;
    }
    return weeks.find((week) => week.id === selectedWeekId) ?? weeks[weeks.length - 1];
  }, [weeks, selectedWeekId]);

  const highlightWeek = useMemo(() => {
    if (!highlightWeekId) {
      return null;
    }
    return weeks.find((week) => week.id === highlightWeekId) ?? null;
  }, [highlightWeekId, weeks]);

  const weeklyPoints: LineChartPoint[] = useMemo(
    () =>
      weeks.map((week) => ({
        label: week.label,
        value: week.completionRate,
        detail: formatPercent(week.completionRate)
      })),
    [weeks]
  );

  const dayPoints: BarChartPoint[] = useMemo(
    () =>
      dayAverages.map((day) => ({
        label: day.label,
        value: day.completionRate,
        detail: formatPercent(day.completionRate)
      })),
    [dayAverages]
  );

  const timelineWeeks = useMemo(() => [...weeks].reverse(), [weeks]);
  const weekOptions = useMemo(() => [...weeks].reverse(), [weeks]);

  if (weeks.length === 0 || !selectedWeek) {
    return null;
  }

  const selectedIndex = weeks.findIndex((week) => week.id === selectedWeek.id);
  const previousWeek: ProgressWeek | null = selectedIndex > 0 ? weeks[selectedIndex - 1] : null;
  const completionDelta = previousWeek ? selectedWeek.completionRate - previousWeek.completionRate : null;
  const deltaDescriptor = describeDelta(completionDelta);

  const totalCompletionPercent = totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0;
  const selectedCompletionPercent = Math.round(selectedWeek.completionRate * 100);
  const highlightPercent = highlightWeek ? Math.round(highlightWeek.completionRate * 100) : null;

  return (
    <div className="progress-dashboard">
      <section className="progress-summary-grid" aria-label="Progress summary">
        <article className="progress-summary-card">
          <p className="progress-summary-label">Sets logged</p>
          <p className="progress-summary-value">{totals.completed}</p>
          <p className="progress-summary-sub">of {totals.total} total sets</p>
        </article>
        <article className="progress-summary-card">
          <p className="progress-summary-label">Average completion</p>
          <p className="progress-summary-value">{totalCompletionPercent}%</p>
          <p className="progress-summary-sub">
            {totals.weekCount} week{totals.weekCount === 1 ? "" : "s"} tracked • {totals.dayCount} day
            {totals.dayCount === 1 ? "" : "s"} logged
          </p>
        </article>
        <article className="progress-summary-card progress-summary-card--accent">
          <p className="progress-summary-label">Current streak</p>
          <p className="progress-summary-value">{currentStreak}</p>
          <p className="progress-summary-sub">
            week{currentStreak === 1 ? "" : "s"} in a row with completed sets
          </p>
          {highlightWeek && (
            <span className="progress-summary-chip">
              Best week • {highlightWeek.longLabel} · {highlightPercent}% complete
            </span>
          )}
        </article>
      </section>

      <div className="progress-grid">
        <article className="progress-card" aria-label="Weekly completion chart">
          <div className="progress-card__header">
            <div>
              <p className="eyebrow">Trend</p>
              <h2>Weekly completion</h2>
            </div>
            <span className="progress-card__meta">
              {weeklyPoints.length} week{weeklyPoints.length === 1 ? "" : "s"}
            </span>
          </div>
          <LineChart points={weeklyPoints} />
        </article>

        <article className="progress-card" aria-label="Average completion by day">
          <div className="progress-card__header">
            <div>
              <p className="eyebrow">Consistency</p>
              <h2>Day-by-day average</h2>
            </div>
            <span className="progress-card__meta">
              {totals.dayCount} logged day{totals.dayCount === 1 ? "" : "s"}
            </span>
          </div>
          <BarChart points={dayPoints} />
        </article>

        <article className="progress-card progress-card--full" aria-label="Selected week details">
          <div className="progress-focus">
            <div className="progress-focus__top">
              <div className="progress-focus__intro">
                <p className="eyebrow">Focus week</p>
                <h2>{selectedWeek.longLabel}</h2>
                <p className="progress-focus__meta">
                  {selectedWeek.templateTitle} • {selectedWeek.completed}/{selectedWeek.total} sets
                  complete
                </p>
                <span className={`progress-delta progress-delta--${deltaDescriptor.tone}`}>
                  {deltaDescriptor.label}
                </span>
              </div>
              <RadialGauge
                label={`${selectedCompletionPercent}%`}
                subLabel="complete"
                value={selectedWeek.completionRate}
              />
            </div>

            <div
              aria-label="Select a week to inspect"
              className="progress-week-picker"
              role="listbox"
              tabIndex={0}
            >
              {weekOptions.map((week) => {
                const percent = Math.round(week.completionRate * 100);
                const isSelected = week.id === selectedWeek.id;
                return (
                  <button
                    aria-selected={isSelected}
                    className="progress-week-picker__option"
                    key={week.id}
                    onClick={() => setSelectedWeekId(week.id)}
                    role="option"
                    type="button"
                  >
                    <strong>{week.label}</strong>
                    <span>{percent}%</span>
                  </button>
                );
              })}
            </div>

            <ul className="progress-day-list">
              {selectedWeek.days.map((day) => {
                const rate = day.total > 0 ? day.completed / day.total : 0;
                const percent = Math.round(rate * 100);
                return (
                  <li className="progress-day" key={day.id}>
                    <div className="progress-day__heading">
                      <div className="progress-day__title">
                        <span>{day.name}</span>
                        <span className="progress-day__chip">
                          {day.completed}/{day.total} set{day.total === 1 ? "" : "s"}
                        </span>
                      </div>
                      <span className="progress-day__percent">{percent}%</span>
                    </div>
                    <div className="progress-bar" aria-hidden="true">
                      <div className="progress-bar__value" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="progress-day__meta">
                      {day.shortName} • {percent}% complete
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </article>

        <article className="progress-card progress-card--full" aria-label="Week timeline">
          <div className="progress-card__header">
            <div>
              <p className="eyebrow">History</p>
              <h2>Week timeline</h2>
            </div>
          </div>
          <ul className="progress-timeline">
            {timelineWeeks.map((week) => {
              const percent = Math.round(week.completionRate * 100);
              return (
                <li className="progress-timeline__item" key={week.id}>
                  <div className="progress-timeline__header">
                    <span className="progress-timeline__title">{week.longLabel}</span>
                    <span className="progress-timeline__percent">{percent}%</span>
                  </div>
                  <div className="progress-bar" aria-hidden="true">
                    <div className="progress-bar__value" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="progress-timeline__meta">
                    <span>{week.templateTitle}</span>
                    <span>
                      {week.completed}/{week.total} set{week.total === 1 ? "" : "s"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      </div>
    </div>
  );
}
