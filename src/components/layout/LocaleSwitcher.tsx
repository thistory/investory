"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale() {
    const nextLocale = locale === "ko" ? "en" : "ko";
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <button
      onClick={switchLocale}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      title={t("locale")}
    >
      {t("locale")}
    </button>
  );
}
