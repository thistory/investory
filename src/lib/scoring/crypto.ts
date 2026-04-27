/**
 * Crypto-specific composite score.
 *
 * Stocks use Quality / Moat / Value / Growth / Momentum.
 * Cryptos lack income statements and book value, so we evaluate four
 * different axes that map to what an investor actually wants to know:
 *
 *  - Momentum  (35%) — short/mid/long-term price action
 *  - Sentiment (25%) — recent news sentiment
 *  - Liquidity (20%) — 24h volume relative to market cap (volume turnover)
 *  - Adoption  (20%) — market-cap rank and supply maturity
 *
 * Each axis is normalized to 0-100. The composite is the weighted sum.
 */

export interface CryptoScoreInput {
  priceChange1h?: number | null;
  priceChange24h?: number | null;
  priceChange7d?: number | null;
  priceChange30d?: number | null;
  priceChange1y?: number | null;
  rsi?: number | null;
  marketCap?: number | null;
  volume24h?: number | null;
  rank?: number | null;
  circulatingSupply?: number | null;
  maxSupply?: number | null;
  newsAvgScore?: number | null; // -1..1 from news sentiment
  newsTotal?: number | null;
}

export type Grade = "S" | "A" | "B" | "C" | "D" | "F";

export interface CryptoScoreResult {
  totalScore: number;
  grade: Grade;
  scores: {
    momentum: number;
    sentiment: number;
    liquidity: number;
    adoption: number;
  };
  insights: string[];
  calculatedAt: Date;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/** Map a percentage change to a 0-100 score (centered at 0%, capped at +/-50%). */
function pctToScore(pct: number | null | undefined, cap: number = 50): number {
  if (pct == null || !Number.isFinite(pct)) return 50;
  const ratio = clamp(pct / cap, -1, 1);
  return 50 + ratio * 50;
}

/** RSI to score: 30..70 ~ healthy, far below 30 = oversold (high), far above 70 = overbought (low). */
function rsiToScore(rsiVal: number | null | undefined): number {
  if (rsiVal == null || !Number.isFinite(rsiVal)) return 50;
  // Penalize extremes symmetrically; ideal is ~50
  const distance = Math.abs(rsiVal - 50);
  return clamp(100 - distance * 1.4, 0, 100);
}

function momentumScore(input: CryptoScoreInput): number {
  // Weighted blend: short term carries less weight than 30d/1y.
  const s1h = pctToScore(input.priceChange1h, 5);
  const s24h = pctToScore(input.priceChange24h, 10);
  const s7d = pctToScore(input.priceChange7d, 20);
  const s30d = pctToScore(input.priceChange30d, 40);
  const s1y = pctToScore(input.priceChange1y, 200);
  const rsiS = rsiToScore(input.rsi);
  return clamp(
    s1h * 0.05 +
      s24h * 0.1 +
      s7d * 0.2 +
      s30d * 0.3 +
      s1y * 0.25 +
      rsiS * 0.1,
    0,
    100
  );
}

function sentimentScore(input: CryptoScoreInput): number {
  if (input.newsTotal == null || input.newsTotal === 0) return 50;
  const avg = input.newsAvgScore ?? 0;
  // avg in -1..1 -> 0..100
  return clamp(50 + avg * 50, 0, 100);
}

function liquidityScore(input: CryptoScoreInput): number {
  if (!input.marketCap || !input.volume24h || input.marketCap <= 0) return 50;
  const turnover = input.volume24h / input.marketCap; // typical: 0.02 (2%) ~ 0.30 (30%)
  // Reward turnover up to 20%; beyond 50% may indicate volatility, slight penalty.
  if (turnover <= 0.2) return clamp(turnover * 500, 0, 100); // 0% -> 0, 20% -> 100
  if (turnover <= 0.5) return clamp(100 - (turnover - 0.2) * 100, 60, 100);
  return clamp(70 - (turnover - 0.5) * 100, 30, 70);
}

function adoptionScore(input: CryptoScoreInput): number {
  let rankScore = 50;
  if (input.rank != null && input.rank > 0) {
    if (input.rank <= 10) rankScore = 100;
    else if (input.rank <= 50) rankScore = 85;
    else if (input.rank <= 100) rankScore = 70;
    else if (input.rank <= 250) rankScore = 55;
    else if (input.rank <= 500) rankScore = 40;
    else rankScore = 25;
  }

  let supplyScore = 60;
  if (input.maxSupply && input.circulatingSupply && input.maxSupply > 0) {
    const ratio = input.circulatingSupply / input.maxSupply;
    // Higher circulating ratio -> lower future dilution risk -> better score.
    supplyScore = clamp(40 + ratio * 60, 0, 100);
  }

  return rankScore * 0.6 + supplyScore * 0.4;
}

function gradeFor(total: number): Grade {
  if (total >= 90) return "S";
  if (total >= 80) return "A";
  if (total >= 70) return "B";
  if (total >= 60) return "C";
  if (total >= 50) return "D";
  return "F";
}

export function calculateCryptoScore(input: CryptoScoreInput): CryptoScoreResult {
  const momentum = momentumScore(input);
  const sentiment = sentimentScore(input);
  const liquidity = liquidityScore(input);
  const adoption = adoptionScore(input);

  const total =
    momentum * 0.35 + sentiment * 0.25 + liquidity * 0.2 + adoption * 0.2;

  const insights: string[] = [];
  if (input.priceChange30d != null) {
    if (input.priceChange30d > 20) insights.push("최근 30일 강한 상승 모멘텀");
    else if (input.priceChange30d < -20) insights.push("최근 30일 큰 폭 조정 구간");
  }
  if (input.rsi != null) {
    if (input.rsi >= 70) insights.push(`RSI ${input.rsi.toFixed(1)} — 과매수 구간`);
    else if (input.rsi <= 30) insights.push(`RSI ${input.rsi.toFixed(1)} — 과매도 구간`);
  }
  if (input.rank != null && input.rank <= 10) {
    insights.push(`시가총액 상위 ${input.rank}위 — 주류 자산`);
  }
  if (input.newsAvgScore != null && input.newsTotal && input.newsTotal > 0) {
    if (input.newsAvgScore > 0.15) insights.push("최근 뉴스 심리 우호적");
    else if (input.newsAvgScore < -0.15) insights.push("최근 뉴스 심리 부정적");
  }
  if (input.maxSupply && input.circulatingSupply) {
    const ratio = input.circulatingSupply / input.maxSupply;
    if (ratio >= 0.95) insights.push("유통량 거의 완전 발행 — 희석 리스크 낮음");
  }

  return {
    totalScore: Math.round(total),
    grade: gradeFor(total),
    scores: {
      momentum: Math.round(momentum),
      sentiment: Math.round(sentiment),
      liquidity: Math.round(liquidity),
      adoption: Math.round(adoption),
    },
    insights,
    calculatedAt: new Date(),
  };
}
