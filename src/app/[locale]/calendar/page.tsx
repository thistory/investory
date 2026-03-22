import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const TIMELINE_STEPS = [
  {
    key: "day1",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    accent: "from-blue-500 to-cyan-400",
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20 dark:border-blue-400/20",
  },
  {
    key: "week1",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    accent: "from-emerald-500 to-green-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20 dark:border-emerald-400/20",
  },
  {
    key: "week2",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    accent: "from-violet-500 to-purple-400",
    bg: "bg-violet-500/10 dark:bg-violet-500/15",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20 dark:border-violet-400/20",
  },
  {
    key: "fomc",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    accent: "from-amber-500 to-yellow-400",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20 dark:border-amber-400/20",
  },
  {
    key: "monthEnd",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    accent: "from-rose-500 to-pink-400",
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20 dark:border-rose-400/20",
  },
] as const;

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calendar" });

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-gradient-to-tr from-blue-600/20 via-purple-500/15 to-amber-500/10 blur-[100px] dark:from-blue-600/10 dark:via-purple-500/8 dark:to-amber-500/5" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-8 sm:pb-12 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 dark:text-zinc-500 mb-3">
            Economic Indicators
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="text-base sm:text-lg text-gray-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/30 via-purple-500/20 to-rose-500/30 dark:from-blue-400/20 dark:via-purple-400/15 dark:to-rose-400/20 hidden sm:block" />

          <div className="space-y-6 sm:space-y-8">
            {TIMELINE_STEPS.map((step, index) => {
              const items = t(`${step.key}Items` as Parameters<typeof t>[0]).split(",");
              return (
                <div key={step.key} className="relative sm:pl-20">
                  {/* Timeline dot */}
                  <div className={`hidden sm:flex absolute left-4 top-6 w-8 h-8 rounded-full items-center justify-center ${step.bg} ${step.text} ring-4 ring-white dark:ring-zinc-950`}>
                    <span className="text-sm font-bold">{index + 1}</span>
                  </div>

                  <div className={`rounded-2xl border ${step.border} bg-white dark:bg-zinc-900 p-5 sm:p-6 transition-all hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-0.5`}>
                    {/* Step header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`shrink-0 w-10 h-10 rounded-xl ${step.bg} ${step.text} flex items-center justify-center`}>
                        {step.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${step.accent} text-white`}>
                            {t(`${step.key}Title` as Parameters<typeof t>[0])}
                          </span>
                          <span className={`text-sm font-semibold ${step.text}`}>
                            {t(`${step.key}Subtitle` as Parameters<typeof t>[0])}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
                          {t(`${step.key}Desc` as Parameters<typeof t>[0])}
                        </p>
                      </div>
                    </div>

                    {/* Checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-0 sm:ml-13">
                      {items.map((item) => (
                        <label
                          key={item}
                          className="flex items-start gap-2.5 rounded-lg px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
                        >
                          <span className={`shrink-0 mt-0.5 w-4 h-4 rounded border-2 ${step.border}`} />
                          {item.trim()}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tip */}
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
