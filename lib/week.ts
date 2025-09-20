import type { WithId } from "mongodb";
import { getTemplate, WEEK_TEMPLATES } from "./templates";
import type { WeekTemplate } from "./templates";

export type SetEntry = {
  set: number;
  weight: string;
  repsOrSec: string;
  rpe: string;
  done: boolean;
};

export type ExerciseEntry = {
  name: string;
  target: string;
  how: string;
  type: "reps" | "seconds";
  suggestedWeight?: string;
  sets: SetEntry[];
};

export type DayEntry = {
  id: string;
  shortName: string;
  name: string;
  exercises: ExerciseEntry[];
};

export type WeekDocument = {
  weekOf: string;
  templateKey: string;
  templateTitle: string;
  templateIndex: number;
  description: string;
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
  days: DayEntry[];
};

export type WeekResponse = {
  id: string;
  weekOf: string;
  templateKey: string;
  templateTitle: string;
  templateIndex: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  days: DayEntry[];
};

export function getWeekStart(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().substring(0, 10);
}

export function getNextWeekStart(weekOf: string): string {
  const base = new Date(`${weekOf}T00:00:00.000Z`);

  if (Number.isNaN(base.getTime())) {
    return getWeekStart();
  }

  const normalized = new Date(`${getWeekStart(base)}T00:00:00.000Z`);
  normalized.setUTCDate(normalized.getUTCDate() + 7);
  return normalized.toISOString().substring(0, 10);
}

type WeekLike = {
  weekOf: string;
  updatedAt: string;
  createdAt?: string;
  status?: "active" | "archived";
};

function parseDate(value: string | undefined): number {
  if (!value) return Number.NaN;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NaN : timestamp;
}

export function dedupeWeeksByStart<T extends WeekLike>(weeks: T[]): T[] {
  const groups = new Map<string, T[]>();

  for (const week of weeks) {
    const existing = groups.get(week.weekOf);
    if (existing) {
      existing.push(week);
    } else {
      groups.set(week.weekOf, [week]);
    }
  }

  const deduped: T[] = [];

  for (const entries of Array.from(groups.values())) {
    const winner = entries.reduce<T | null>((best, candidate) => {
      if (!best) {
        return candidate;
      }

      const bestStatus = best.status;
      const candidateStatus = candidate.status;

      if (bestStatus !== "archived" && candidateStatus === "archived") {
        return candidate;
      }

      if (bestStatus === "archived" && candidateStatus !== "archived") {
        return best;
      }

      const bestUpdated = parseDate(best.updatedAt);
      const candidateUpdated = parseDate(candidate.updatedAt);

      if (!Number.isNaN(candidateUpdated) && !Number.isNaN(bestUpdated)) {
        if (candidateUpdated > bestUpdated) {
          return candidate;
        }
        if (candidateUpdated < bestUpdated) {
          return best;
        }
      }

      const bestCreated = parseDate(best.createdAt);
      const candidateCreated = parseDate(candidate.createdAt);

      if (!Number.isNaN(candidateCreated) && !Number.isNaN(bestCreated)) {
        if (candidateCreated > bestCreated) {
          return candidate;
        }
        if (candidateCreated < bestCreated) {
          return best;
        }
      }

      return candidate;
    }, null);

    if (winner) {
      deduped.push(winner);
    }
  }

  deduped.sort((a, b) => {
    const updatedDiff = parseDate(b.updatedAt) - parseDate(a.updatedAt);
    if (!Number.isNaN(updatedDiff) && updatedDiff !== 0) {
      return updatedDiff;
    }

    const createdDiff = parseDate(b.createdAt ?? b.updatedAt) - parseDate(a.createdAt ?? a.updatedAt);
    if (!Number.isNaN(createdDiff) && createdDiff !== 0) {
      return createdDiff;
    }

    return b.weekOf.localeCompare(a.weekOf);
  });

  return deduped;
}

function buildSets(count: number, suggestedWeight?: string): SetEntry[] {
  return Array.from({ length: count }).map((_, index) => ({
    set: index + 1,
    weight: suggestedWeight ?? "",
    repsOrSec: "",
    rpe: "",
    done: false
  }));
}

export function createWeekDocument(templateIndex: number, weekOf?: string): WeekDocument {
  const template: WeekTemplate = getTemplate(templateIndex);
  const resolvedWeekOf = weekOf ?? getWeekStart();
  const now = new Date();

  const days: DayEntry[] = template.days.map((day) => ({
    id: `${template.key}-${day.id}`,
    shortName: day.shortName,
    name: day.name,
    exercises: day.exercises.map((exercise) => ({
      name: exercise.name,
      target: exercise.target,
      how: exercise.how,
      type: exercise.type,
      suggestedWeight: exercise.suggestedWeight,
      sets: buildSets(exercise.sets, exercise.suggestedWeight)
    }))
  }));

  return {
    weekOf: resolvedWeekOf,
    templateKey: template.key,
    templateTitle: template.title,
    templateIndex,
    description: template.description,
    status: "active",
    createdAt: now,
    updatedAt: now,
    days
  };
}

export function serializeWeek(doc: WithId<WeekDocument>): WeekResponse {
  const template = getTemplate(doc.templateIndex);

  function resolveTemplateDay(dayId: string, dayName: string) {
    const prefix = `${doc.templateKey}-`;
    const bareId = dayId.startsWith(prefix) ? dayId.slice(prefix.length) : dayId;
    return (
      template.days.find((candidate) => candidate.id === bareId) ||
      template.days.find((candidate) => candidate.name === dayName)
    );
  }

  function selectSuggestedWeight(
    dayId: string,
    dayName: string,
    exercise: WeekDocument["days"][number]["exercises"][number]
  ) {
    if (exercise.suggestedWeight && exercise.suggestedWeight.trim().length > 0) {
      return exercise.suggestedWeight.trim();
    }

    const templateDay = resolveTemplateDay(dayId, dayName);
    const templateExercise = templateDay?.exercises.find(
      (candidate) => candidate.name === exercise.name
    );

    return templateExercise?.suggestedWeight?.trim() ?? "";
  }

  return {
    id: doc._id.toString(),
    weekOf: doc.weekOf,
    templateKey: doc.templateKey,
    templateTitle: doc.templateTitle,
    templateIndex: doc.templateIndex,
    description: doc.description,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    days: doc.days.map((day) => ({
      id: day.id,
      shortName: day.shortName,
      name: day.name,
      exercises: day.exercises.map((exercise) => {
        const suggestedWeight = selectSuggestedWeight(day.id, day.name, exercise);
        const normalizedSuggestion = suggestedWeight.trim();
        const resolvedSuggestion = normalizedSuggestion.length > 0 ? normalizedSuggestion : undefined;

        return {
          name: exercise.name,
          target: exercise.target,
          how: exercise.how,
          type: exercise.type,
          suggestedWeight: resolvedSuggestion,
          sets: exercise.sets.map((set) => {
            const hasWeight = typeof set.weight === "string" && set.weight.trim().length > 0;
            const resolvedWeight = hasWeight
              ? set.weight
              : resolvedSuggestion ?? "";

            return {
              set: set.set,
              weight: resolvedWeight,
              repsOrSec: set.repsOrSec,
              rpe: set.rpe,
              done: set.done
            };
          })
        };
      })
    }))
  };
}

export function nextTemplateIndex(currentIndex: number): number {
  if (WEEK_TEMPLATES.length === 0) {
    return 0;
  }
  return (currentIndex + 1) % WEEK_TEMPLATES.length;
}
