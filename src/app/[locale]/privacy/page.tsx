import { getTranslations } from "next-intl/server";

export default async function PrivacyPage({
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
          {t("privacyTitle")}
        </h1>
        <p className="text-sm text-gray-400 dark:text-zinc-500 mb-8">
          {t("lastUpdated", { date: "2026-02-22" })}
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <p className="text-gray-600 dark:text-zinc-300">{t("privacyIntro")}</p>

          <section>
            <h2 className="text-lg font-semibold mb-2">{t("collectTitle")}</h2>
            <p className="text-gray-600 dark:text-zinc-300 mb-2">{t("collectDesc")}</p>
            <ul className="list-disc pl-5 text-gray-600 dark:text-zinc-300 space-y-1">
              <li>{t("collectEmail")}</li>
            </ul>
            <p className="text-gray-500 dark:text-zinc-400 text-sm mt-2">{t("collectNone")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">{t("purposeTitle")}</h2>
            <ul className="list-disc pl-5 text-gray-600 dark:text-zinc-300 space-y-1">
              <li>{t("purposeAuth")}</li>
              <li>{t("purposeAccess")}</li>
              <li>{t("purposeAdmin")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">{t("storageTitle")}</h2>
            <p className="text-gray-600 dark:text-zinc-300">{t("storageDesc")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">{t("sharingTitle")}</h2>
            <p className="text-gray-600 dark:text-zinc-300">{t("sharingDesc")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">{t("cookieTitle")}</h2>
            <p className="text-gray-600 dark:text-zinc-300">{t("cookieDesc")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">{t("rightsTitle")}</h2>
            <p className="text-gray-600 dark:text-zinc-300">{t("rightsDesc")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">{t("contactTitle")}</h2>
            <p className="text-gray-600 dark:text-zinc-300">{t("contactDesc")}</p>
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
    title: t("privacyTitle"),
  };
}
