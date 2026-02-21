export type { StockAnalysisReport, AnalysisSource, AnalysisIndexEntry } from "./types";

import fs from "fs";
import path from "path";
import type { StockAnalysisReport, AnalysisIndexEntry } from "./types";

type Locale = "ko" | "en";

const REPORTS_DIR = path.join(process.cwd(), "data/analysis/reports");
const INDEX_PATH = path.join(process.cwd(), "data/analysis/index.json");
const INDEX_EN_PATH = path.join(process.cwd(), "data/analysis/index.en.json");

function getIndexPath(locale: Locale): string {
  return locale === "en" ? INDEX_EN_PATH : INDEX_PATH;
}

const _cache: Record<string, Record<string, StockAnalysisReport[]>> = {};

/** data/analysis/reports/ 디렉토리를 스캔하여 전체 리포트를 로드 */
function loadReports(locale: Locale = "ko"): Record<string, StockAnalysisReport[]> {
  const cacheKey = locale;
  if (_cache[cacheKey] && process.env.NODE_ENV === "production") return _cache[cacheKey];

  const registry: Record<string, StockAnalysisReport[]> = {};

  if (!fs.existsSync(REPORTS_DIR)) {
    _cache[cacheKey] = registry;
    return registry;
  }

  const symbols = fs
    .readdirSync(REPORTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const suffix = locale === "en" ? ".en.json" : ".json";

  for (const symbol of symbols) {
    const symbolDir = path.join(REPORTS_DIR, symbol);
    const files = fs
      .readdirSync(symbolDir)
      .filter((f) => {
        if (locale === "en") {
          return f.endsWith(".en.json");
        }
        // For Korean: match .json but not .en.json
        return f.endsWith(".json") && !f.endsWith(".en.json");
      })
      .sort()
      .reverse();

    const reports: StockAnalysisReport[] = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(symbolDir, file), "utf-8");
      reports.push(JSON.parse(content) as StockAnalysisReport);
    }

    if (reports.length > 0) {
      registry[symbol] = reports;
    }
  }

  _cache[cacheKey] = registry;
  return registry;
}

/** 해당 종목의 가장 최신 분석 리포트 */
export function getLatestAnalysis(
  symbol: string,
  locale: Locale = "ko"
): StockAnalysisReport | null {
  const reports = loadReports(locale)[symbol.toUpperCase()];
  return reports?.[0] ?? null;
}

/** 해당 종목의 모든 분석 리포트 (최신순) */
export function getAllAnalyses(symbol: string, locale: Locale = "ko"): StockAnalysisReport[] {
  return loadReports(locale)[symbol.toUpperCase()] ?? [];
}

/** 해당 종목의 특정 날짜 분석 리포트 */
export function getAnalysisByDate(
  symbol: string,
  date: string,
  locale: Locale = "ko"
): StockAnalysisReport | null {
  const reports = loadReports(locale)[symbol.toUpperCase()];
  return reports?.find((r) => r.analysisDate === date) ?? null;
}

/** 분석 리포트가 있는 모든 종목 목록 (최신 리포트 포함) */
export function getAnalyzedSymbols(locale: Locale = "ko"): {
  symbol: string;
  companyName: string;
  latestDate: string;
  reportCount: number;
}[] {
  return Object.entries(loadReports(locale))
    .filter(([, reports]) => reports.length > 0)
    .map(([symbol, reports]) => ({
      symbol,
      companyName: reports[0].companyName,
      latestDate: reports[0].analysisDate,
      reportCount: reports.length,
    }));
}

/** 전체 종목의 모든 리포트를 날짜 내림차순으로 (일별 리스트용) */
export function getAllReportsByDate(locale: Locale = "ko"): StockAnalysisReport[] {
  const flat: StockAnalysisReport[] = [];
  for (const reports of Object.values(loadReports(locale))) {
    flat.push(...reports);
  }
  flat.sort((a, b) => b.analysisDate.localeCompare(a.analysisDate));
  return flat;
}

// ─── Index ───────────────────────────────────────────

function reportToEntry(r: StockAnalysisReport): AnalysisIndexEntry {
  return {
    symbol: r.symbol,
    companyName: r.companyName,
    analysisDate: r.analysisDate,
    currentPrice: r.currentPrice,
    marketCap: r.marketCap,
    oneLiner: r.businessSummary.oneLiner,
    buyReasonTitles: r.buyReasons.map((b) => b.title),
    riskTitles: r.risks.map((k) => k.title),
    highRiskCount: r.risks.filter(
      (k) => k.severity === "critical" || k.severity === "high"
    ).length,
    consensusTarget: r.analystOpinions.consensusTarget,
    upsidePercent: r.analystOpinions.upsidePercent,
    sourceCount: r.sources.length,
  };
}

/** 전체 리포트를 스캔하여 index.json 생성 */
function rebuildIndex(locale: Locale = "ko"): AnalysisIndexEntry[] {
  const all = getAllReportsByDate(locale);
  const entries = all.map(reportToEntry);
  const indexPath = getIndexPath(locale);
  const dir = path.dirname(indexPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(indexPath, JSON.stringify(entries, null, 2));
  return entries;
}

const _indexCache: Record<string, AnalysisIndexEntry[]> = {};

/** 인덱스 로드 — stale 시 자동 리빌드 */
export function loadIndex(locale: Locale = "ko"): AnalysisIndexEntry[] {
  const cacheKey = locale;
  if (_indexCache[cacheKey] && process.env.NODE_ENV === "production") return _indexCache[cacheKey];

  const indexPath = getIndexPath(locale);
  const suffix = locale === "en" ? ".en.json" : ".json";

  if (fs.existsSync(indexPath)) {
    const indexMtime = fs.statSync(indexPath).mtimeMs;
    let needsRebuild = false;

    if (fs.existsSync(REPORTS_DIR)) {
      const symbols = fs
        .readdirSync(REPORTS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory());
      for (const sym of symbols) {
        const symDir = path.join(REPORTS_DIR, sym.name);
        const files = fs.readdirSync(symDir).filter((f) => {
          if (locale === "en") return f.endsWith(".en.json");
          return f.endsWith(".json") && !f.endsWith(".en.json");
        });
        for (const f of files) {
          if (fs.statSync(path.join(symDir, f)).mtimeMs > indexMtime) {
            needsRebuild = true;
            break;
          }
        }
        if (needsRebuild) break;
      }
    }

    if (!needsRebuild) {
      const data = JSON.parse(
        fs.readFileSync(indexPath, "utf-8")
      ) as AnalysisIndexEntry[];
      _indexCache[cacheKey] = data;
      return data;
    }
  }

  const entries = rebuildIndex(locale);
  _indexCache[cacheKey] = entries;
  return entries;
}

/** 통계: 총 건수, 종목 수, 날짜 수, 종목 목록 */
export function getIndexStats(locale: Locale = "ko") {
  const entries = loadIndex(locale);
  const dateSet = new Set<string>();
  const symbolCounts: Record<string, { companyName: string; count: number }> = {};

  for (const e of entries) {
    dateSet.add(e.analysisDate);
    if (!symbolCounts[e.symbol]) {
      symbolCounts[e.symbol] = { companyName: e.companyName, count: 0 };
    }
    symbolCounts[e.symbol].count++;
  }

  const symbols = Object.entries(symbolCounts).map(([symbol, info]) => ({
    symbol,
    companyName: info.companyName,
    reportCount: info.count,
  }));

  return {
    totalReports: entries.length,
    symbolCount: symbols.length,
    dateCount: dateSet.size,
    symbols,
  };
}
