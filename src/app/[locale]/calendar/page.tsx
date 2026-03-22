import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import {
  loadMonth,
  getAvailableMonths,
  getCurrentMonth,
} from "@/data/calendar";
import type { EconEvent, EventCategory } from "@/data/calendar/types";

const CATEGORY_COLORS = {
  employment: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
    gradient: "from-emerald-500 to-green-400",
  },
  inflation: {
    bg: "bg-violet-500/10 dark:bg-violet-500/15",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20",
    dot: "bg-violet-500",
    gradient: "from-violet-500 to-purple-400",
  },
  fed: {
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
    gradient: "from-amber-500 to-yellow-400",
  },
  gdp: {
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
    gradient: "from-blue-500 to-cyan-400",
  },
  other: {
    bg: "bg-gray-500/10 dark:bg-gray-500/15",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-500/20",
    dot: "bg-gray-500",
    gradient: "from-gray-500 to-zinc-400",
  },
} as const;

const CATEGORY_KEYS: Record<EventCategory, string> = {
  employment: "categoryEmployment",
  inflation: "categoryInflation",
  fed: "categoryFed",
  gdp: "categoryGdp",
  other: "categoryOther",
};

function getAdjacentMonth(
  months: string[],
  current: string,
  direction: "prev" | "next"
): string | null {
  const idx = months.indexOf(current);
  if (direction === "prev") return months[idx + 1] ?? null;
  return idx > 0 ? months[idx - 1] : null;
}

function formatMonthDisplay(month: string, locale: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "long",
  });
}

function formatEventDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale } = await params;
  const { month: monthParam } = await searchParams;
  const t = await getTranslations({ locale, namespace: "calendar" });

  const localeKey = locale === "en" ? "en" : "ko";
  const months = getAvailableMonths(localeKey);
  const currentMonth = monthParam && months.includes(monthParam) ? monthParam : (months[0] ?? getCurrentMonth());
  const data = loadMonth(currentMonth, localeKey);

  const prevMonth = getAdjacentMonth(months, currentMonth, "prev");
  const nextMonth = getAdjacentMonth(months, currentMonth, "next");

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-gradient-to-tr from-blue-600/20 via-purple-500/15 to-amber-500/10 blur-[100px] dark:from-blue-600/10 dark:via-purple-500/8 dark:to-amber-500/5" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-8 sm:pb-12 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 dark:text-zinc-500 mb-3">
            {t("sectionLabel")}
          </p>

          {/* Month navigation */}
          <div className="flex items-center justify-center gap-4 mb-4">
            {prevMonth ? (
              <Link
                href={`/calendar?month=${prevMonth}`}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                aria-label={t("prevMonth")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </Link>
            ) : (
              <span className="p-2 text-gray-200 dark:text-zinc-700">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </span>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {formatMonthDisplay(currentMonth, locale)}
            </h1>

            {nextMonth ? (
              <Link
                href={`/calendar?month=${nextMonth}`}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                aria-label={t("nextMonth")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ) : (
              <span className="p-2 text-gray-200 dark:text-zinc-700">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            )}
          </div>

          {data && (
            <p className="text-sm text-gray-400 dark:text-zinc-500">
              {t("updatedAt", { date: data.updatedAt })}
            </p>
          )}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        {/* No data state */}
        {!data ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-zinc-500">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-600 dark:text-zinc-300 mb-2">
              {t("noData")}
            </p>
            <p className="text-sm text-gray-400 dark:text-zinc-500">
              {t("noDataDesc")}
            </p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <StatCards data={data} t={t} />

            {/* Timeline */}
            <div className="relative mt-10 sm:mt-12">
              {/* Vertical line */}
              <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/30 via-violet-500/20 to-blue-500/30 dark:from-emerald-400/20 dark:via-violet-400/15 dark:to-blue-400/20 hidden sm:block" />

              <div className="space-y-6 sm:space-y-8">
                {data.events.map((event) => (
                  <EventCard key={event.id} event={event} locale={locale} t={t} />
                ))}
              </div>
            </div>

            {/* Monthly summary */}
            {data.summary && (
              <div className="mt-10 sm:mt-12 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t("monthlySummary")}
                </h2>
                <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-5">
                  <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed">
                    {data.summary.text}
                  </p>
                  <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-200 mb-2">
                      {t("portfolioReview")}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
                      {data.summary.portfolioReview}
                    </p>
                  </div>
                  <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-200 mb-2">
                      {t("nextMonthPreview")}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
                      {data.summary.nextMonthPreview}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tip footer */}
        <div className="mt-10 sm:mt-12 rounded-2xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-amber-500/5 dark:from-blue-500/10 dark:via-purple-500/8 dark:to-amber-500/10 border border-blue-500/10 dark:border-blue-400/10 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="shrink-0 text-lg">💡</span>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-200 leading-relaxed">
                {t("tip")}
              </p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">
                {t("disclaimer")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- Stat Cards ---------- */

function StatCards({
  data,
  t,
}: {
  data: { events: EconEvent[]; rateOutlook?: { holdProbability: number; cutProbability: number; source: string } };
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  // Next upcoming event
  const upcomingEvent = data.events.find((e) => e.status === "upcoming");
  let nextEventLabel: string;
  let nextEventValue: string;
  if (upcomingEvent) {
    const days = getDaysUntil(upcomingEvent.date);
    nextEventValue = days === 0 ? t("today") : t("daysLeft", { days });
    nextEventLabel = upcomingEvent.name;
  } else {
    nextEventValue = t("allPublished");
    nextEventLabel = "";
  }

  // Rate outlook
  const hasRate = !!data.rateOutlook;
  const holdPct = data.rateOutlook?.holdProbability ?? 0;
  const cutPct = data.rateOutlook?.cutProbability ?? 0;

  // CPI trend - latest published inflation event
  const latestCpi = [...data.events]
    .reverse()
    .find((e) => e.category === "inflation" && e.status === "published" && e.actual);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Next event */}
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
          {t("nextEvent")}
        </p>
        <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
          {nextEventValue}
        </p>
        {nextEventLabel && (
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 truncate">
            {nextEventLabel}
          </p>
        )}
      </div>

      {/* Rate outlook */}
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
          {t("rateOutlook")}
        </p>
        {hasRate ? (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {holdPct}%
              </span>
              <span className="text-sm text-gray-500 dark:text-zinc-400">
                {t("hold")}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {cutPct}%
              </span>
              <span className="text-sm text-gray-500 dark:text-zinc-400">
                {t("cut")}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-2xl font-extrabold text-gray-300 dark:text-zinc-600">
            —
          </p>
        )}
      </div>

      {/* CPI trend */}
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
          {t("cpiTrend")}
        </p>
        {latestCpi ? (
          <>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {latestCpi.actual}
            </p>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 truncate">
              {latestCpi.name}
            </p>
          </>
        ) : (
          <p className="text-2xl font-extrabold text-gray-300 dark:text-zinc-600">
            —
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- Event Card ---------- */

function EventCard({
  event,
  locale,
  t,
}: {
  event: EconEvent;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const colors = CATEGORY_COLORS[event.category];
  const isUpcoming = event.status === "upcoming";
  const categoryKey = CATEGORY_KEYS[event.category];

  const surpriseColors: Record<string, string> = {
    above: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    below: "bg-red-500/10 text-red-600 dark:text-red-400",
    inline: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  };

  return (
    <div className="relative sm:pl-20">
      {/* Timeline dot */}
      <div
        className={`hidden sm:block absolute left-[18px] top-6 w-5 h-5 rounded-full ${colors.dot} ring-4 ring-white dark:ring-zinc-950`}
      />

      <div
        className={`rounded-2xl border ${colors.border} bg-white dark:bg-zinc-900 p-5 sm:p-6 transition-all hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-0.5 ${
          isUpcoming ? "border-dashed" : ""
        }`}
      >
        {/* Card header */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r ${colors.gradient} text-white`}
          >
            {t(categoryKey as Parameters<typeof t>[0])}
          </span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            {formatEventDate(event.date, locale)}
            {event.dateEnd && ` — ${formatEventDate(event.dateEnd, locale)}`}
          </span>
          <span
            className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
              isUpcoming
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isUpcoming ? t("upcoming") : t("published")}
          </span>
        </div>

        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
          {event.name}
        </h3>

        {/* Published event details */}
        {!isUpcoming && (
          <div className="space-y-3">
            {/* Actual vs expected */}
            <div className="flex items-center gap-4 flex-wrap text-sm">
              {event.actual && (
                <span className="text-gray-700 dark:text-zinc-200">
                  <span className="text-gray-400 dark:text-zinc-500">{t("actual")}:</span>{" "}
                  <span className="font-semibold">{event.actual}</span>
                </span>
              )}
              {event.expected && (
                <span className="text-gray-700 dark:text-zinc-200">
                  <span className="text-gray-400 dark:text-zinc-500">{t("expected")}:</span>{" "}
                  <span className="font-semibold">{event.expected}</span>
                </span>
              )}
              {event.previous && (
                <span className="text-gray-700 dark:text-zinc-200">
                  <span className="text-gray-400 dark:text-zinc-500">{t("previous")}:</span>{" "}
                  <span className="font-semibold">{event.previous}</span>
                </span>
              )}
              {event.surprise && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${surpriseColors[event.surprise]}`}
                >
                  {t(event.surprise as Parameters<typeof t>[0])}
                </span>
              )}
            </div>

            {event.marketReaction && (
              <div className="text-sm text-gray-500 dark:text-zinc-400">
                <span className="font-medium text-gray-600 dark:text-zinc-300">
                  {t("marketReaction")}:
                </span>{" "}
                {event.marketReaction}
              </div>
            )}

            {event.analysis && (
              <div className="text-sm text-gray-500 dark:text-zinc-400">
                <span className="font-medium text-gray-600 dark:text-zinc-300">
                  {t("analysis")}:
                </span>{" "}
                {event.analysis}
              </div>
            )}
          </div>
        )}

        {/* Upcoming event details */}
        {isUpcoming && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap text-sm">
              {event.expected && (
                <span className="text-gray-700 dark:text-zinc-200">
                  <span className="text-gray-400 dark:text-zinc-500">{t("expected")}:</span>{" "}
                  <span className="font-semibold">{event.expected}</span>
                </span>
              )}
              {event.previous && (
                <span className="text-gray-700 dark:text-zinc-200">
                  <span className="text-gray-400 dark:text-zinc-500">{t("previous")}:</span>{" "}
                  <span className="font-semibold">{event.previous}</span>
                </span>
              )}
            </div>

            {event.watchPoints && event.watchPoints.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">
                  {t("watchPoints")}
                </p>
                <ul className="space-y-1">
                  {event.watchPoints.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-zinc-300"
                    >
                      <span className={`shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calendar" });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}
