import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const isKo = locale === "ko";

  return {
    metadataBase: new URL("https://investory.kro.kr"),
    title: {
      default: t("defaultTitle"),
      template: "%s | Investory",
    },
    description: t("defaultDescription"),
    keywords: t("keywords").split(","),
    authors: [{ name: "Investory" }],
    openGraph: {
      type: "website",
      locale: isKo ? "ko_KR" : "en_US",
      siteName: "Investory",
      images: [
        {
          url: "/logo-full.png",
          width: 743,
          height: 743,
          alt: "Investory",
        },
      ],
    },
    twitter: {
      card: "summary",
      images: ["/logo-full.png"],
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ko: "/ko",
        en: "/en",
        "x-default": "/ko",
      },
    },
    manifest: "/manifest.json",
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Navbar />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
