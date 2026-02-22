import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getIndexStats } from "@/data/analysis";
import { getManagedStocks } from "@/lib/stocks/managed-stocks";
import FeaturedStocks from "@/components/stock/FeaturedStocks";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import TypewriterText from "@/components/home/TypewriterText";

export const dynamic = "force-dynamic";

async function WebSiteJsonLd({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Investory",
    url: "https://investory.kro.kr",
    description: t("jsonLdDescription"),
    potentialAction: {
      "@type": "SearchAction",
      target: `https://investory.kro.kr/${locale}/analysis?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  // JSON-LD uses trusted, server-generated content only (no user input)
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

const PILLAR_COLORS = [
  "from-blue-500 to-cyan-400",
  "from-violet-500 to-purple-400",
  "from-emerald-500 to-green-400",
  "from-amber-500 to-yellow-400",
  "from-rose-500 to-pink-400",
];

const PILLAR_LABELS = ["Quality", "Moat", "Value", "Growth", "Momentum"];
const PILLAR_KEYS = [
  "pillarQuality",
  "pillarMoat",
  "pillarValue",
  "pillarGrowth",
  "pillarMomentum",
] as const;

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const stats = getIndexStats();
  const featuredStocks = await getManagedStocks();
  const session = await auth();

  return (
    <main className="min-h-screen overflow-hidden">
      <WebSiteJsonLd locale={locale} />
      {/* ─── HERO ─── */}
      <section className="relative isolate">
        {/* Ambient glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-tr from-blue-600/30 via-purple-500/20 to-pink-500/20 blur-[120px] dark:from-blue-600/15 dark:via-purple-500/10 dark:to-pink-500/10" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-zinc-700 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-24 pb-16 sm:pb-24 text-center">
          {/* Logo */}
          <div className="relative mb-8 flex items-center justify-center">
            <div
              className="absolute -z-10 w-40 h-40 rounded-full blur-[50px] bg-gradient-to-tr from-blue-500/25 to-purple-500/20 dark:from-blue-500/30 dark:to-purple-500/25"
              aria-hidden="true"
            />
            <Image
              src="/logo.png"
              alt="Investory"
              width={112}
              height={112}
              className="relative dark:mix-blend-screen"
              style={{
                maskImage:
                  "radial-gradient(circle, black 60%, transparent 100%)",
                WebkitMaskImage:
                  "radial-gradient(circle, black 60%, transparent 100%)",
              }}
              priority
            />
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-4">
            <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-zinc-200 dark:to-white bg-clip-text text-transparent">
              <TypewriterText
                prefix={t("titlePrefix")}
                words={t("titleWords").split(",")}
              />
            </span>
          </h1>

          {/* Stats badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium tracking-wide border border-blue-500/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
            </span>
            {t("statsLabel", {
              symbolCount: stats.symbolCount,
              totalReports: stats.totalReports,
            })}
          </div>

          <p className="text-base sm:text-lg text-gray-500 dark:text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
            {t("description")
              .split("\n")
              .map((line, i) => (
                <span key={i}>
                  {i > 0 && <br className="hidden sm:block" />}
                  {line}
                </span>
              ))}
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/analysis"
              className="group relative px-7 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-blue-400/20 hover:-translate-y-0.5"
            >
              {t("ctaReport")}
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <Link
              href="/stock/TSLA"
              className="px-7 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold rounded-xl transition-all hover:bg-gray-200 dark:hover:bg-zinc-700 hover:-translate-y-0.5"
            >
              {t("ctaStock")}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 5 PILLARS ─── */}
      <section className="relative py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 dark:text-zinc-500 mb-3">
              Investment Framework
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {t("pillarsTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {PILLAR_LABELS.map((label, i) => (
              <div
                key={label}
                className="group relative p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20"
              >
                <div
                  className={`h-1 w-8 mb-3 rounded-full bg-gradient-to-r ${PILLAR_COLORS[i]}`}
                />
                <div className="text-sm font-bold mb-1">{label}</div>
                <div className="text-xs text-gray-400 dark:text-zinc-500 leading-relaxed">
                  {t(PILLAR_KEYS[i])}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED STOCKS ─── */}
      <section className="relative py-16 sm:py-20">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-gray-50/50 dark:via-zinc-900/30 to-transparent" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 dark:text-zinc-500 mb-3">
                Featured
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold">
                {t("featured")}
              </h2>
            </div>
            <Link
              href="/compare?symbols=TSLA,NVDA"
              className="text-sm text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors"
            >
              {t("compareLink")}
            </Link>
          </div>

          <FeaturedStocks
            stocks={featuredStocks}
            isAdmin={session?.user?.email === process.env.ADMIN_EMAIL}
            locale={locale}
          />
        </div>
      </section>

      {/* ─── METHODOLOGY ─── */}
      <section className="py-16 sm:py-20 border-t border-gray-200/60 dark:border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: t("methodScoring"),
                desc: t("methodScoringDesc"),
                accent: "text-blue-500",
              },
              {
                title: t("methodResearch"),
                desc: t("methodResearchDesc"),
                accent: "text-violet-500",
              },
              {
                title: t("methodTracking"),
                desc: t("methodTrackingDesc"),
                accent: "text-emerald-500",
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className={`text-sm font-bold ${item.accent} mb-2`}>
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-8 text-center text-xs text-gray-400 dark:text-zinc-600">
        <span className="font-medium">Investory</span> · {t("footer")}
        <div className="mt-2 flex items-center justify-center gap-3">
          <Link href="/terms" className="hover:text-gray-600 dark:hover:text-zinc-400 transition-colors">
            {t("terms")}
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-zinc-400 transition-colors">
            {t("privacy")}
          </Link>
        </div>
      </footer>
    </main>
  );
}
