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

function buildSets(count: number): SetEntry[] {
  return Array.from({ length: count }).map((_, index) => ({
    set: index + 1,
    weight: "",
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
      sets: buildSets(exercise.sets)
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
      exercises: day.exercises.map((exercise) => ({
        name: exercise.name,
        target: exercise.target,
        how: exercise.how,
        type: exercise.type,
        sets: exercise.sets.map((set) => ({
          set: set.set,
          weight: set.weight,
          repsOrSec: set.repsOrSec,
          rpe: set.rpe,
          done: set.done
        }))
      }))
    }))
  };
}

export function nextTemplateIndex(currentIndex: number): number {
  if (WEEK_TEMPLATES.length === 0) {
    return 0;
  }
  return (currentIndex + 1) % WEEK_TEMPLATES.length;
}
