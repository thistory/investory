import type { MetadataRoute } from "next";
import { getAnalyzedSymbols, loadIndex } from "@/data/analysis";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://investory.kro.kr";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/analysis`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Stock pages (per symbol)
  const symbols = getAnalyzedSymbols();
  const stockPages: MetadataRoute.Sitemap = symbols.flatMap((s) => [
    {
      url: `${baseUrl}/stock/${s.symbol}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stock/${s.symbol}/analysis`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    },
  ]);

  // Individual report pages
  const index = loadIndex();
  const reportPages: MetadataRoute.Sitemap = index.map((entry) => ({
    url: `${baseUrl}/stock/${entry.symbol}/analysis/${entry.analysisDate}`,
    lastModified: new Date(entry.analysisDate),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...stockPages, ...reportPages];
}
