# Economic Calendar System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static calendar page with a data-driven system: a skill that researches real economic indicators, JSON storage, and a Dashboard+Timeline web UI.

**Architecture:** Claude Code skill produces `data/calendar/YYYY-MM.json` (ko/en) via WebSearch. Server component reads JSON directly (same pattern as stock-analysis). Dashboard stat cards + vertical timeline, color-coded by event category.

**Tech Stack:** Next.js 16 server components, TypeScript, TailwindCSS, next-intl, file-based JSON storage

**Spec:** `docs/superpowers/specs/2026-03-22-econ-calendar-design.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/data/calendar/types.ts` | TypeScript interfaces (EconCalendarMonth, EconEvent) |
| Create | `src/data/calendar/index.ts` | Data loading: loadMonth, getAvailableMonths, getCurrentMonth |
| Replace | `src/app/[locale]/calendar/page.tsx` | Dashboard + Timeline server component |
| Modify | `src/messages/ko.json` | Update calendar i18n namespace |
| Modify | `src/messages/en.json` | Update calendar i18n namespace |
| Create | `.claude/skills/econ-calendar/SKILL.md` | Data collection skill definition |
| Create | `data/calendar/2026-03.json` | Sample Korean data (seeded by skill) |
| Create | `data/calendar/2026-03.en.json` | Sample English data (seeded by skill) |

---

### Task 1: Data Types

**Files:**
- Create: `src/data/calendar/types.ts`

- [ ] **Step 1: Create TypeScript interfaces**

```typescript
// src/data/calendar/types.ts

export type EventCategory = "employment" | "inflation" | "fed" | "gdp" | "other";
export type EventStatus = "upcoming" | "published";
export type SurpriseDirection = "above" | "below" | "inline";

export interface EconEvent {
  id: string;
  name: string;
  category: EventCategory;
  date: string;
  dateEnd?: string;
  status: EventStatus;
  // Pre-release
  previous?: string;
  expected?: string;
  watchPoints?: string[];
  // Post-release
  actual?: string;
  surprise?: SurpriseDirection;
  marketReaction?: string;
  analysis?: string;
}

export interface MonthlySummary {
  text: string;
  portfolioReview: string;
  nextMonthPreview: string;
}

export interface EconCalendarMonth {
  month: string;
  updatedAt: string;
  rateOutlook?: {
    holdProbability: number;
    cutProbability: number;
    source: string;
  };
  summary?: MonthlySummary;
  events: EconEvent[];
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/data/calendar/types.ts
git commit -m "feat(calendar): add TypeScript interfaces for economic calendar data"
```

---

### Task 2: Data Loading Layer

**Files:**
- Create: `src/data/calendar/index.ts`

- [ ] **Step 1: Implement data loading functions**

```typescript
// src/data/calendar/index.ts

import fs from "fs";
import path from "path";
import type { EconCalendarMonth } from "./types";

export type { EconCalendarMonth, EconEvent, EventCategory } from "./types";

type Locale = "ko" | "en";

const CALENDAR_DIR = path.join(process.cwd(), "data/calendar");

/** Load a specific month's data */
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

/** List all months that have data files (sorted descending) */
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

/** Get current month as YYYY-MM */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Load the most recent month that has data */
export function getLatestMonth(locale: Locale = "ko"): EconCalendarMonth | null {
  const months = getAvailableMonths(locale);
  if (months.length === 0) return null;
  return loadMonth(months[0], locale);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/data/calendar/index.ts
git commit -m "feat(calendar): add data loading layer for monthly JSON files"
```

---

### Task 3: Update i18n Translations

**Files:**
- Modify: `src/messages/ko.json` — replace `calendar` namespace
- Modify: `src/messages/en.json` — replace `calendar` namespace

- [ ] **Step 1: Replace Korean calendar namespace**

Replace the entire `"calendar": { ... }` block in `src/messages/ko.json` with:

```json
"calendar": {
  "title": "월간 경제지표 캘린더",
  "subtitle": "핵심 경제 이벤트와 시장 영향을 한눈에",
  "sectionLabel": "경제지표",
  "updatedAt": "마지막 업데이트: {date}",
  "prevMonth": "이전 달",
  "nextMonth": "다음 달",
  "noData": "이 달의 경제지표 데이터가 아직 없습니다.",
  "noDataDesc": "곧 업데이트될 예정입니다.",
  "nextEvent": "다음 이벤트",
  "daysLeft": "D-{days}",
  "today": "오늘",
  "allPublished": "모두 발표됨",
  "rateOutlook": "금리 전망",
  "hold": "동결",
  "cut": "인하",
  "cpiTrend": "CPI 추세",
  "upcoming": "예정",
  "published": "발표됨",
  "actual": "실제",
  "expected": "예상",
  "previous": "이전",
  "above": "상회",
  "below": "하회",
  "inline": "부합",
  "marketReaction": "시장 반응",
  "analysis": "분석",
  "watchPoints": "주목 포인트",
  "monthlySummary": "월간 요약",
  "portfolioReview": "포트폴리오 복기",
  "nextMonthPreview": "다음 달 미리보기",
  "categoryEmployment": "고용",
  "categoryInflation": "물가",
  "categoryFed": "연준",
  "categoryGdp": "GDP",
  "categoryOther": "기타",
  "tip": "매달 초에 이 캘린더를 확인하고, 주요 지표 발표 전후로 시장 반응을 기록해두면 투자 판단력이 향상됩니다.",
  "disclaimer": "이 캘린더는 일반적인 미국 경제지표 발표 패턴을 기반으로 합니다. 실제 날짜는 매월 달라질 수 있으니, 공식 일정을 반드시 확인하세요."
}
```

- [ ] **Step 2: Replace English calendar namespace**

Replace the entire `"calendar": { ... }` block in `src/messages/en.json` with:

```json
"calendar": {
  "title": "Monthly Economic Calendar",
  "subtitle": "Key economic events and market impact at a glance",
  "sectionLabel": "Economic Indicators",
  "updatedAt": "Last updated: {date}",
  "prevMonth": "Previous month",
  "nextMonth": "Next month",
  "noData": "No economic data for this month yet.",
  "noDataDesc": "Updates coming soon.",
  "nextEvent": "Next Event",
  "daysLeft": "D-{days}",
  "today": "Today",
  "allPublished": "All Published",
  "rateOutlook": "Rate Outlook",
  "hold": "Hold",
  "cut": "Cut",
  "cpiTrend": "CPI Trend",
  "upcoming": "Upcoming",
  "published": "Published",
  "actual": "Actual",
  "expected": "Expected",
  "previous": "Previous",
  "above": "Beat",
  "below": "Miss",
  "inline": "In Line",
  "marketReaction": "Market Reaction",
  "analysis": "Analysis",
  "watchPoints": "Watch Points",
  "monthlySummary": "Monthly Summary",
  "portfolioReview": "Portfolio Review",
  "nextMonthPreview": "Next Month Preview",
  "categoryEmployment": "Employment",
  "categoryInflation": "Inflation",
  "categoryFed": "Fed",
  "categoryGdp": "GDP",
  "categoryOther": "Other",
  "tip": "Check this calendar at the start of each month and record market reactions around key releases to sharpen your investment decisions.",
  "disclaimer": "This calendar is based on typical US economic release patterns. Actual dates vary each month — always confirm with official schedules."
}
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/messages/ko.json','utf-8')); console.log('ko OK')" && node -e "JSON.parse(require('fs').readFileSync('src/messages/en.json','utf-8')); console.log('en OK')"`
Expected: `ko OK` and `en OK`

- [ ] **Step 4: Commit**

```bash
git add src/messages/ko.json src/messages/en.json
git commit -m "feat(calendar): update i18n for data-driven economic calendar"
```

---

### Task 4: Calendar Page UI (Dashboard + Timeline)

**Files:**
- Replace: `src/app/[locale]/calendar/page.tsx`

This is the largest task. The page is a server component that:
1. Reads the month's JSON data via `loadMonth()`
2. Renders stat cards, timeline, and monthly summary
3. Supports month navigation via search params (`?month=2026-03`)

- [ ] **Step 1: Implement the calendar page**

Replace `src/app/[locale]/calendar/page.tsx` entirely. Key sections:

**Imports and data loading:**
- Import `getTranslations` from `next-intl/server`
- Import `loadMonth`, `getAvailableMonths`, `getCurrentMonth` from `@/data/calendar`
- Read `searchParams.month` or fall back to `getCurrentMonth()`
- Load month data and available months for prev/next navigation

**Category color mapping** (used throughout):
```typescript
const CATEGORY_COLORS = {
  employment: { bg: "bg-emerald-500/10 dark:bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-500", gradient: "from-emerald-500 to-green-400" },
  inflation: { bg: "bg-violet-500/10 dark:bg-violet-500/15", text: "text-violet-600 dark:text-violet-400", border: "border-violet-500/20", dot: "bg-violet-500", gradient: "from-violet-500 to-purple-400" },
  fed: { bg: "bg-amber-500/10 dark:bg-amber-500/15", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", dot: "bg-amber-500", gradient: "from-amber-500 to-yellow-400" },
  gdp: { bg: "bg-blue-500/10 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20", dot: "bg-blue-500", gradient: "from-blue-500 to-cyan-400" },
  other: { bg: "bg-gray-500/10 dark:bg-gray-500/15", text: "text-gray-600 dark:text-gray-400", border: "border-gray-500/20", dot: "bg-gray-500", gradient: "from-gray-500 to-zinc-400" },
} as const;
```

**Layout structure (top to bottom):**

1. **Header section** — ambient glow background (same pattern as home page), section label via `t("sectionLabel")`, month/year title with prev/next `<Link>` arrows, `updatedAt` timestamp
2. **No-data state** — if `loadMonth()` returns null, show empty state with `t("noData")` message
3. **Stat cards (3-column grid)** — next upcoming event (compute from events with status "upcoming", show D-day), rate outlook (from `data.rateOutlook`), CPI trend (find latest inflation event with status "published", show actual value)
4. **Timeline** — vertical line on left (`sm:` breakpoint), iterate over `data.events` sorted by date. Each event card:
   - Color-coded by category (dot + border + badge)
   - Category badge + date + event name
   - If `published`: actual vs expected comparison, surprise badge (above/below/inline with color), market reaction, analysis text
   - If `upcoming`: expected + previous values, watch points as a list, dashed border
5. **Monthly summary** — only rendered if `data.summary` exists. Three sub-sections: text summary, portfolio review, next month preview
6. **Tip footer** — same as current page, with `t("tip")` and `t("disclaimer")`

**Month navigation helper:**
```typescript
function getAdjacentMonth(months: string[], current: string, direction: "prev" | "next"): string | null {
  const idx = months.indexOf(current);
  if (direction === "prev") return months[idx + 1] ?? null; // months are sorted descending
  return idx > 0 ? months[idx - 1] : null;
}
```

**`generateMetadata`:** Same pattern as existing page — returns `{ title: t("title"), description: t("subtitle") }`

**Responsive design:**
- Stat cards: `grid-cols-1 sm:grid-cols-3`
- Timeline left line: `hidden sm:block`
- Timeline cards: full-width mobile, `sm:pl-20` desktop with left offset for timeline dot

**Dark/light mode:** All colors use Tailwind `dark:` variants. Category colors use opacity-based values that work in both modes.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\[locale\]/calendar/page.tsx
git commit -m "feat(calendar): replace static checklist with dashboard + timeline UI"
```

---

### Task 5: econ-calendar Skill

**Files:**
- Create: `.claude/skills/econ-calendar/SKILL.md`

- [ ] **Step 1: Write skill definition**

The skill must define:

**Frontmatter:**
```yaml
---
name: econ-calendar
description: Research and compile monthly US economic indicator calendar. Collects CPI, NFP, FOMC schedules, actual results, market reactions, and portfolio implications.
argument-hint: "[YYYY-MM] [update EVENT_ID] [summary]"
allowed-tools: WebSearch, WebFetch, Read, Write, Bash, Grep, Glob
---
```

**Modes (parsed from $ARGUMENTS):**

1. **Init mode** (`/econ-calendar 2026-04`):
   - WebSearch for the month's economic calendar
   - Find dates for: NFP, CPI, PPI, FOMC, GDP, retail sales, PCE, and other notable releases
   - For each event: populate id, name, category, date, expected, previous, watchPoints
   - Set all events to `status: "upcoming"`
   - Populate `rateOutlook` from CME FedWatch data
   - Write both `data/calendar/YYYY-MM.json` and `YYYY-MM.en.json`

2. **Update mode** (`/econ-calendar 2026-03 update nfp`):
   - Read existing `data/calendar/YYYY-MM.json`
   - Find the event matching EVENT_ID
   - WebSearch for actual results, market reaction
   - Update: actual, surprise, marketReaction, analysis, status → "published"
   - Update `rateOutlook` if relevant
   - Write updated ko + en files

3. **Summary mode** (`/econ-calendar 2026-03 summary`):
   - Read existing month data
   - WebSearch for month-end economic summary
   - Compile `summary.text`, `summary.portfolioReview`, `summary.nextMonthPreview`
   - Write updated ko + en files

**Output rules:**
- JSON must conform to `EconCalendarMonth` interface in `src/data/calendar/types.ts`
- Korean file: `data/calendar/YYYY-MM.json`
- English file: `data/calendar/YYYY-MM.en.json`
- Event IDs: `YYYY-MM-{shortname}` (e.g., `2026-03-nfp`, `2026-03-cpi`, `2026-03-fomc`)
- Events sorted by date ascending
- `updatedAt` set to current ISO timestamp

**Writing guidelines (same convention as stock-analysis):**
- Korean: natural, beginner-friendly tone
- English: professional but accessible
- Analysis: always connect to portfolio implications ("what this means for investors")

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/econ-calendar/SKILL.md
git commit -m "feat(calendar): add econ-calendar skill for data collection"
```

---

### Task 6: Seed Data with Skill

**Files:**
- Create: `data/calendar/2026-03.json`
- Create: `data/calendar/2026-03.en.json`

- [ ] **Step 1: Run the econ-calendar skill to generate March 2026 data**

Run: `/econ-calendar 2026-03`

This will WebSearch for March 2026 economic calendar data and produce both JSON files.

- [ ] **Step 2: If any March events have already been released, run updates**

For each released event (e.g., NFP on Mar 7, CPI on Mar 12):
Run: `/econ-calendar 2026-03 update nfp`
Run: `/econ-calendar 2026-03 update cpi`
(etc. for any published events)

- [ ] **Step 3: Verify JSON files are valid and match the TypeScript interface**

Run: `node -e "const d = JSON.parse(require('fs').readFileSync('data/calendar/2026-03.json','utf-8')); console.log(d.month, d.events.length + ' events')"`
Expected: `2026-03 N events`

- [ ] **Step 4: Commit data files**

```bash
git add data/calendar/
git commit -m "feat(calendar): seed March 2026 economic calendar data"
```

---

### Task 7: Build Verification & Integration Test

- [ ] **Step 1: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 2: Run production build**

Run: `rm -rf .next && npm run build`
Expected: build succeeds, `/[locale]/calendar` route listed

- [ ] **Step 3: Manual verification checklist**

Verify the calendar page renders correctly:
- [ ] Stat cards show correct data from JSON
- [ ] Timeline renders all events in date order
- [ ] Published events show actual vs expected + market reaction
- [ ] Upcoming events show watch points with dashed border
- [ ] Month navigation arrows work (disabled when no adjacent month data)
- [ ] Dark mode renders correctly
- [ ] Mobile layout stacks properly
- [ ] Korean and English both display correctly

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(calendar): address integration issues from build verification"
```
