# Monthly Economic Calendar System — Design Spec

## Overview

Replace the static checklist calendar page with a data-driven system that researches, collects, and displays real US economic indicator data (CPI, NFP, FOMC, etc.) each month.

## System Components

### 1. Data Collection Skill (`econ-calendar`)

**Trigger:** Manual — `/econ-calendar` or `/econ-calendar 2026-03`

**Two modes:**

- **Init mode (month start):** WebSearch to find the month's CPI, NFP, FOMC, and other key indicator release dates. Populate expected values, previous values, and watch points for each event.
- **Update mode (post-release):** Run after a specific event is released. Fill in actual values, surprise direction (above/below/inline expectations), market reaction (S&P, Nasdaq, 10Y yield moves), and portfolio implications analysis.

**Output:** `data/calendar/YYYY-MM.json` (Korean) + `data/calendar/YYYY-MM.en.json` (English)

**Skill location:** `.claude/skills/econ-calendar/SKILL.md`

**Pattern:** Follows existing `stock-analysis` skill — WebSearch for research, structured JSON output, ko/en dual files.

### 2. Data Structure

```typescript
interface EconCalendarMonth {
  month: string;              // "2026-03"
  updatedAt: string;          // ISO timestamp
  summary?: {                 // Filled at month end
    text: string;             // One-page summary of the month
    portfolioReview: string;  // Portfolio response retrospective
    nextMonthPreview: string; // Key events preview for next month
  };
  events: EconEvent[];
}

interface EconEvent {
  id: string;                 // "2026-03-nfp"
  name: string;               // "Non-Farm Payrolls (NFP)"
  category: "employment" | "inflation" | "fed" | "gdp" | "other";
  date: string;               // "2026-03-07"
  dateEnd?: string;           // For multi-day events like FOMC: "2026-03-19"
  status: "upcoming" | "published";
  // Pre-release
  previous?: string;          // "151K"
  expected?: string;          // "200K"
  watchPoints?: string[];     // Key things to watch
  // Post-release
  actual?: string;            // "+228K"
  surprise?: "above" | "below" | "inline";
  marketReaction?: string;    // "S&P +0.8%, 10Y yield +5bp"
  analysis?: string;          // Market interpretation + portfolio implications
}
```

### 3. Data Loading Layer

**Location:** `src/data/calendar/`

**Files:**
- `types.ts` — TypeScript interfaces (EconCalendarMonth, EconEvent)
- `index.ts` — Data loading functions

**Functions:**
- `loadMonth(month: string, locale: string): EconCalendarMonth | null` — Load a specific month's data from `data/calendar/YYYY-MM[.en].json`
- `getAvailableMonths(): string[]` — List all months that have data files
- `getCurrentMonth(): string` — Returns current month in YYYY-MM format
- `getLatestMonth(locale: string): EconCalendarMonth | null` — Load the most recent month with data

**Pattern:** Same as `src/data/analysis/index.ts` — file-based, filesystem scan, no database.

### 4. Web UI — Dashboard + Timeline Layout

**Route:** `/[locale]/calendar` (replaces current static page)

**Server component** — reads JSON directly, no API route needed for initial render.

#### Layout Sections:

**Header:**
- Month/year title with prev/next navigation
- Subtitle with last-updated timestamp

**Stat Cards (top, 3 cards):**
- Next upcoming event (name + days until)
- Rate outlook (Fed hold/cut probability from latest FOMC or CME data)
- CPI trend (latest headline CPI + direction arrow)

**Timeline (middle):**
- Vertical timeline, color-coded by category:
  - Employment (green) — NFP, unemployment, wages
  - Inflation (purple) — CPI, PPI, PCE
  - Fed (amber) — FOMC meetings, minutes, speeches
  - GDP/Other (blue) — GDP, retail sales, etc.
- Published events: actual vs expected badge, surprise indicator, market reaction summary, analysis text
- Upcoming events: expected value, watch points, dashed border styling

**Monthly Summary (bottom):**
- Appears when `summary` field is populated (month-end)
- One-page indicator summary
- Portfolio retrospective
- Next month preview

#### Responsive Design:
- Mobile: single column, stat cards stack vertically, timeline full-width
- Desktop: stat cards in 3-column grid, timeline with left vertical line

#### Dark/Light Mode:
- All elements use Tailwind dark: variants per project convention
- Category colors work in both modes (use opacity-based colors)

#### i18n:
- All user-facing text via `useTranslations("calendar")` / `getTranslations()`
- Event data itself is already localized (separate .json and .en.json files)

### 5. File Structure

```
data/calendar/
  2026-03.json              # Korean month data
  2026-03.en.json           # English month data

.claude/skills/econ-calendar/
  SKILL.md                  # Skill definition

src/data/calendar/
  types.ts                  # TypeScript interfaces
  index.ts                  # Data loading functions

src/app/[locale]/calendar/
  page.tsx                  # Page component (replaces current static page)

src/messages/ko.json        # Updated calendar namespace
src/messages/en.json        # Updated calendar namespace
```

### 6. Skill Workflow

#### Monthly Init (run on ~1st of month):

```
User: /econ-calendar 2026-04

Skill:
1. WebSearch: "April 2026 US economic calendar CPI NFP FOMC schedule"
2. WebSearch: "April 2026 FOMC meeting date dot plot"
3. WebSearch: "April 2026 non-farm payrolls release date consensus"
4. WebSearch: "April 2026 CPI release date expectations"
5. Compile events[] with dates, expected values, watch points
6. Write data/calendar/2026-04.json (ko) + 2026-04.en.json (en)
```

#### Event Update (run after release):

```
User: /econ-calendar 2026-03 update nfp

Skill:
1. Read existing data/calendar/2026-03.json
2. WebSearch: "March 2026 non-farm payrolls actual results"
3. WebSearch: "March 2026 NFP market reaction S&P treasury"
4. Update the NFP event: actual, surprise, marketReaction, analysis
5. Set status to "published"
6. Write updated JSON files
```

#### Month-End Summary (run at end of month):

```
User: /econ-calendar 2026-03 summary

Skill:
1. Read existing data/calendar/2026-03.json (all events should be published)
2. WebSearch: "March 2026 economic indicators summary"
3. Compile summary: text, portfolioReview, nextMonthPreview
4. Write updated JSON files
```

### 7. Constraints & Decisions

- **No API route initially.** Server component reads files directly. Can add `/api/calendar/[month]` later if client-side fetching is needed.
- **No authentication required.** Calendar page is public (like analysis reports).
- **No cron/automation.** Manual trigger via skill, same as stock-analysis.
- **Month navigation.** Only show months that have data files. Disable prev/next arrows when no data exists.
- **Existing static checklist.** The current `/calendar` page with the 5-step checklist will be completely replaced.
