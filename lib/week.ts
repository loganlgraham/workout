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

export function getMonday(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().substring(0, 10);
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
  const resolvedWeekOf = weekOf ?? getMonday();
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
