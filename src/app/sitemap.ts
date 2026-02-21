import type { MetadataRoute } from "next";
import { getAnalyzedSymbols, loadIndex } from "@/data/analysis";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://investory.kro.kr";
  const locales = ["ko", "en"] as const;

  // Static pages for each locale
  const staticPages: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    {
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
      alternates: {
        languages: {
          ko: `${baseUrl}/ko`,
          en: `${baseUrl}/en`,
        },
      },
    },
    {
      url: `${baseUrl}/${locale}/analysis`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
      alternates: {
        languages: {
          ko: `${baseUrl}/ko/analysis`,
          en: `${baseUrl}/en/analysis`,
        },
      },
    },
  ]);

  // Stock pages (per symbol, per locale)
  const symbols = getAnalyzedSymbols();
  const stockPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    symbols.flatMap((s) => [
      {
        url: `${baseUrl}/${locale}/stock/${s.symbol}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
        alternates: {
          languages: {
            ko: `${baseUrl}/ko/stock/${s.symbol}`,
            en: `${baseUrl}/en/stock/${s.symbol}`,
          },
        },
      },
      {
        url: `${baseUrl}/${locale}/stock/${s.symbol}/analysis`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.7,
        alternates: {
          languages: {
            ko: `${baseUrl}/ko/stock/${s.symbol}/analysis`,
            en: `${baseUrl}/en/stock/${s.symbol}/analysis`,
          },
        },
      },
    ])
  );

  // Individual report pages (per locale)
  const reportPages: MetadataRoute.Sitemap = locales.flatMap((locale) => {
    const index = loadIndex(locale);
    return index.map((entry) => ({
      url: `${baseUrl}/${locale}/stock/${entry.symbol}/analysis/${entry.analysisDate}`,
      lastModified: new Date(entry.analysisDate),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: {
          ko: `${baseUrl}/ko/stock/${entry.symbol}/analysis/${entry.analysisDate}`,
          en: `${baseUrl}/en/stock/${entry.symbol}/analysis/${entry.analysisDate}`,
        },
      },
    }));
  });

  return [...staticPages, ...stockPages, ...reportPages];
}
