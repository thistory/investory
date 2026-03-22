import fs from "fs";
import path from "path";
import type { EconCalendarMonth } from "./types";

export type { EconCalendarMonth, EconEvent, EventCategory } from "./types";

type Locale = "ko" | "en";

const CALENDAR_DIR = path.join(process.cwd(), "data/calendar");

export function loadMonth(
  month: string,
  locale: Locale = "ko"
): EconCalendarMonth | null {
  const suffix = locale === "en" ? ".en.json" : ".json";
  const filePath = path.join(CALENDAR_DIR, `${month}${suffix}`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as EconCalendarMonth;
}

export function getAvailableMonths(locale: Locale = "ko"): string[] {
  if (!fs.existsSync(CALENDAR_DIR)) return [];
  const suffix = locale === "en" ? ".en.json" : ".json";
  return fs
    .readdirSync(CALENDAR_DIR)
    .filter((f) => {
      if (locale === "en") return f.endsWith(".en.json");
      return f.endsWith(".json") && !f.endsWith(".en.json");
    })
    .map((f) => f.replace(suffix, ""))
    .sort()
    .reverse();
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getLatestMonth(locale: Locale = "ko"): EconCalendarMonth | null {
  const months = getAvailableMonths(locale);
  if (months.length === 0) return null;
  return loadMonth(months[0], locale);
}
