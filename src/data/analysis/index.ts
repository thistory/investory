export type { StockAnalysisReport, AnalysisSource } from "./types";

import fs from "fs";
import path from "path";
import type { StockAnalysisReport } from "./types";

const REPORTS_DIR = path.join(process.cwd(), "data/analysis/reports");

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
