import { getTranslations } from "next-intl/server";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {t("termsTitle")}
        </h1>
        <p className="text-sm text-gray-400 dark:text-zinc-500 mb-8">
          {t("lastUpdated", { date: "2026-02-22" })}
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <p className="text-gray-600 dark:text-zinc-300">{t("termsIntro")}</p>

          <section>
            <h2 className="text-lg font-semibold mb-2">{t("serviceTitle")}</h2>
            <p className="text-gray-600 dark:text-zinc-300">{t("serviceDesc")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">{t("disclaimerTitle")}</h2>
            <p className="text-gray-600 dark:text-zinc-300">{t("disclaimerDesc")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">{t("accountTitle")}</h2>
            <p className="text-gray-600 dark:text-zinc-300">{t("accountDesc")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">{t("dataTitle")}</h2>
            <p className="text-gray-600 dark:text-zinc-300">{t("dataDesc")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">{t("liabilityTitle")}</h2>
            <p className="text-gray-600 dark:text-zinc-300">{t("liabilityDesc")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">{t("changeTitle")}</h2>
            <p className="text-gray-600 dark:text-zinc-300">{t("changeDesc")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">{t("governingTitle")}</h2>
            <p className="text-gray-600 dark:text-zinc-300">{t("governingDesc")}</p>
          </section>
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return {
    title: t("termsTitle"),
  };
}
