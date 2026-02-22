import { getManagedStocks } from "@/lib/stocks/managed-stocks";
import { StocksGrid } from "@/components/stock/StocksGrid";
import { getTranslations } from "next-intl/server";
import { requirePageAdmin } from "@/lib/auth/require-page-auth";

export const dynamic = "force-dynamic";

export default async function StocksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requirePageAdmin(locale);
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
