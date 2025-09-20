import type { WeekResponse } from "@/lib/week";

export type WeekListEntry = WeekResponse & {
  status: "active" | "archived";
  archivedAt: string | null;
};
