import { getManagedStocks } from "@/lib/stocks/managed-stocks";
import { StocksGrid } from "@/components/stock/StocksGrid";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import LockScreen from "@/components/ui/LockScreen";

export const dynamic = "force-dynamic";

export default async function StocksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;

  if (!isAdmin) {
    const t = await getTranslations({ locale, namespace: "lockScreen" });
    return (
      <LockScreen
        locale={locale}
        title={t("stocks.title")}
        description={t("stocks.description")}
        features={[
          t("stocks.features.0"),
          t("stocks.features.1"),
          t("stocks.features.2"),
          t("stocks.features.3"),
        ]}
        source="stocks"
        ctaText={t("ctaText")}
        loginText={t("loginText")}
        waitlistHeading={t("waitlistHeading")}
        waitlistSubheading={t("waitlistSubheading")}
      />
    );
  }

  const t = await getTranslations({ locale, namespace: "stocks" });
  const stocks = await getManagedStocks();

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 dark:text-zinc-500 mb-3">
            Portfolio
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
            {t("description")}
          </p>
        </div>
        <StocksGrid stocks={stocks} />
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
  const t = await getTranslations({ locale, namespace: "stocks" });

  return {
    title: t("title"),
    description: t("description"),
  };
}
