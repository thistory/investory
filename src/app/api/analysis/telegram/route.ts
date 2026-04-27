import { NextRequest, NextResponse } from "next/server";
import { getAllReportsByDate, getLatestAnalysis } from "@/data/analysis";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// 감시 종목 목록
const WATCHLIST = ["TSLA", "BMNR", "BTCUSDT"];

/**
 * GET /api/analysis/telegram
 * 텔레그램 전송용 완성된 마크다운 텍스트 반환
 *
 * Query params:
 *   ?symbols=TSLA,BMNR  (optional, 기본값: WATCHLIST)
 *   ?format=markdown     (optional, markdown | json)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");
  const format = searchParams.get("format") || "markdown";

  const symbols = symbolsParam
    ? symbolsParam.split(",").map((s) => s.trim().toUpperCase())
    : WATCHLIST;

  const reports = symbols
    .map((s) => getLatestAnalysis(s))
    .filter(Boolean);

  if (reports.length === 0) {
    return NextResponse.json(
      { success: false, error: "No reports found" },
      { status: 404 }
    );
  }

  // JSON 포맷 요청
  if (format === "json") {
    return NextResponse.json({
      success: true,
      date: reports[0]!.analysisDate,
      reports: reports.map((r) => ({
        symbol: r!.symbol,
        companyName: r!.companyName,
        price: r!.currentPrice,
        marketCap: r!.marketCap,
        oneLiner: r!.businessSummary.oneLiner,
        buyReasons: r!.buyReasons.map((b) => b.title),
        topRisk: r!.risks[0]?.title,
        analystTarget: `$${r!.analystOpinions.consensusTarget} (+${r!.analystOpinions.upsidePercent}%)`,
        reportUrl: `${BASE_URL}/stock/${r!.symbol}/analysis/${r!.analysisDate}`,
      })),
    });
  }

  // 텔레그램 마크다운 포맷 (MarkdownV2 호환)
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  let message = `📊 *모닝 리포트* — ${escMd(today)}\n\n`;

  for (const report of reports) {
    if (!report) continue;

    const url = `${BASE_URL}/stock/${report.symbol}/analysis/${report.analysisDate}`;

    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    message += `*${escMd(report.symbol)}* ${escMd(report.companyName)}\n`;

    if (report.snsContent?.telegram) {
      message += `\n${escMd(report.snsContent.telegram.text)}\n\n`;
    } else {
      const targetStr = `$${report.analystOpinions.consensusTarget}`;
      const upsideStr = `\\+${report.analystOpinions.upsidePercent}%`;
      message += `💰 $${escMd(String(report.currentPrice))} \\(목표 ${escMd(targetStr)}, ${upsideStr}\\)\n\n`;
      message += `${escMd(report.businessSummary.oneLiner)}\n\n`;
      message += `✅ *매수 이유*\n`;
      report.buyReasons.forEach((reason, i) => {
        message += ` ${i + 1}\\. ${escMd(reason.title)}\n`;
      });
      message += `\n`;
      message += `⚠️ *최대 리스크:* ${escMd(report.risks[0]?.title || "N/A")}\n\n`;
    }

    message += `🔗 [상세 분석 보기 →](${url})\n\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━\n`;
  message += `_${escMd("투자 권유가 아닌 정보 제공 목적입니다")}_`;

  return new NextResponse(message, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/** Telegram MarkdownV2 이스케이프 */
function escMd(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}
