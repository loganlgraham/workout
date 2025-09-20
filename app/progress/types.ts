export type ProgressDay = {
  id: string;
  name: string;
  shortName: string;
  completed: number;
  total: number;
};

export type ProgressWeek = {
  id: string;
  weekOf: string;
  label: string;
  longLabel: string;
  updatedAt: string;
  templateTitle: string;
  status: "active" | "archived";
  completed: number;
  total: number;
  completionRate: number;
  days: ProgressDay[];
};

export type ProgressDayAverage = {
  key: string;
  label: string;
  completed: number;
  total: number;
  completionRate: number;
  index: number;
};

export type ProgressTotals = {
  completed: number;
  total: number;
  weekCount: number;
  dayCount: number;
  averageCompletion: number;
};

export type ProgressData = {
  weeks: ProgressWeek[];
  totals: ProgressTotals;
  dayAverages: ProgressDayAverage[];
  highlightWeekId: string | null;
  latestWeekId: string | null;
  currentStreak: number;
};
