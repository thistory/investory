export type { StockAnalysisReport, AnalysisSource, AnalysisIndexEntry } from "./types";

import fs from "fs";
import path from "path";
import type { StockAnalysisReport, AnalysisIndexEntry } from "./types";

const REPORTS_DIR = path.join(process.cwd(), "data/analysis/reports");
const INDEX_PATH = path.join(process.cwd(), "data/analysis/index.json");

let _cache: Record<string, StockAnalysisReport[]> | null = null;

/** data/analysis/reports/ 디렉토리를 스캔하여 전체 리포트를 로드 */
function loadReports(): Record<string, StockAnalysisReport[]> {
  // 프로덕션: 한 번만 로드 후 메모리 캐시
  // 개발: 매번 새로 로드 (새 파일 즉시 반영)
  if (_cache && process.env.NODE_ENV === "production") return _cache;

  const registry: Record<string, StockAnalysisReport[]> = {};

  if (!fs.existsSync(REPORTS_DIR)) {
    _cache = registry;
    return registry;
  }

  const symbols = fs
    .readdirSync(REPORTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const symbol of symbols) {
    const symbolDir = path.join(REPORTS_DIR, symbol);
    const files = fs
      .readdirSync(symbolDir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse(); // 최신 날짜가 먼저

    const reports: StockAnalysisReport[] = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(symbolDir, file), "utf-8");
      reports.push(JSON.parse(content) as StockAnalysisReport);
    }

    if (reports.length > 0) {
      registry[symbol] = reports;
    }
  }

  _cache = registry;
  return registry;
}

/** 해당 종목의 가장 최신 분석 리포트 */
export function getLatestAnalysis(
  symbol: string
): StockAnalysisReport | null {
  const reports = loadReports()[symbol.toUpperCase()];
  return reports?.[0] ?? null;
}

/** 해당 종목의 모든 분석 리포트 (최신순) */
export function getAllAnalyses(symbol: string): StockAnalysisReport[] {
  return loadReports()[symbol.toUpperCase()] ?? [];
}

/** 해당 종목의 특정 날짜 분석 리포트 */
export function getAnalysisByDate(
  symbol: string,
  date: string
): StockAnalysisReport | null {
  const reports = loadReports()[symbol.toUpperCase()];
  return reports?.find((r) => r.analysisDate === date) ?? null;
}

/** 분석 리포트가 있는 모든 종목 목록 (최신 리포트 포함) */
export function getAnalyzedSymbols(): {
  symbol: string;
  companyName: string;
  latestDate: string;
  reportCount: number;
}[] {
  return Object.entries(loadReports())
    .filter(([, reports]) => reports.length > 0)
    .map(([symbol, reports]) => ({
      symbol,
      companyName: reports[0].companyName,
      latestDate: reports[0].analysisDate,
      reportCount: reports.length,
    }));
}

/** 전체 종목의 모든 리포트를 날짜 내림차순으로 (일별 리스트용) */
export function getAllReportsByDate(): StockAnalysisReport[] {
  const flat: StockAnalysisReport[] = [];
  for (const reports of Object.values(loadReports())) {
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
function rebuildIndex(): AnalysisIndexEntry[] {
  const all = getAllReportsByDate();
  const entries = all.map(reportToEntry);
  const dir = path.dirname(INDEX_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(INDEX_PATH, JSON.stringify(entries, null, 2));
  return entries;
}

let _indexCache: AnalysisIndexEntry[] | null = null;

/** 인덱스 로드 — stale 시 자동 리빌드 */
export function loadIndex(): AnalysisIndexEntry[] {
  if (_indexCache && process.env.NODE_ENV === "production") return _indexCache;

  // 인덱스 파일 존재 여부 + stale 체크
  if (fs.existsSync(INDEX_PATH)) {
    const indexMtime = fs.statSync(INDEX_PATH).mtimeMs;
    let needsRebuild = false;

    if (fs.existsSync(REPORTS_DIR)) {
      const symbols = fs
        .readdirSync(REPORTS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory());
      for (const sym of symbols) {
        const symDir = path.join(REPORTS_DIR, sym.name);
        const files = fs.readdirSync(symDir).filter((f) => f.endsWith(".json"));
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
        fs.readFileSync(INDEX_PATH, "utf-8")
      ) as AnalysisIndexEntry[];
      _indexCache = data;
      return data;
    }
  }

  const entries = rebuildIndex();
  _indexCache = entries;
  return entries;
}

/** 통계: 총 건수, 종목 수, 날짜 수, 종목 목록 */
export function getIndexStats() {
  const entries = loadIndex();
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
