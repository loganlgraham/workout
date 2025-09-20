export type ProgressExerciseSummary = {
  id: string;
  name: string;
  target: string;
  completed: number;
  total: number;
};

export type ProgressDay = {
  id: string;
  name: string;
  shortName: string;
  completed: number;
  total: number;
  isoDate: string;
  dateLabel: string;
  weekdayLabel: string;
  focusId: string;
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

export type ProgressDayDetail = {
  id: string;
  weekId: string;
  isoDate: string;
  dateLabel: string;
  weekdayLabel: string;
  dayNumberLabel: string;
  name: string;
  shortName: string;
  completed: number;
  total: number;
  completionRate: number;
  exercises: ProgressExerciseSummary[];
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
  dayDetails: ProgressDayDetail[];
  highlightWeekId: string | null;
  latestWeekId: string | null;
  currentStreak: number;
};
