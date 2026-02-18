/**
 * Quality Score Calculator
 *
 * 품질 점수 계산 (30% 가중치)
 * - 수익성 (40점): ROE, ROA, Net Margin
 * - 재무건전성 (30점): Debt-to-Equity, Current Ratio
 * - 성장 일관성 (30점): Revenue Growth, Earnings Growth
 *
 * Warren Buffett의 원칙: ROE > 15%가 우수한 기업
 */

import { QualityInput, QualityScore, Insight, safeNumber } from './types';

/**
 * Quality Score 계산
 */
export function calculateQualityScore(input: QualityInput): QualityScore {
  const profitability = calculateProfitabilityScore(input);
  const financialHealth = calculateFinancialHealthScore(input);
  const growthConsistency = calculateGrowthConsistencyScore(input);

  const total = profitability + financialHealth + growthConsistency;
  const insights = generateQualityInsights(input, profitability, financialHealth, growthConsistency);

  return {
    total,
    profitability,
    financialHealth,
    growthConsistency,
    insights,
  };
}

/**
 * 수익성 점수 계산 (0-40점)
 */
function calculateProfitabilityScore(input: QualityInput): number {
  let score = 0;

  // ROE > 15%: 15점 (Buffett threshold)
  const roe = safeNumber(input.roe);
  if (roe >= 20) score += 15;
  else if (roe >= 15) score += 12;
  else if (roe >= 10) score += 8;
  else if (roe >= 5) score += 4;

  // ROA > 8%: 10점
  const roa = safeNumber(input.roa);
  if (roa >= 10) score += 10;
  else if (roa >= 8) score += 8;
  else if (roa >= 5) score += 5;
  else if (roa >= 3) score += 2;

  // Net Profit Margin > 10%: 8점
  const netMargin = safeNumber(input.netMargin);
  if (netMargin >= 20) score += 8;
  else if (netMargin >= 15) score += 7;
  else if (netMargin >= 10) score += 6;
  else if (netMargin >= 5) score += 3;

  // Operating Margin > 15%: 7점
  const opMargin = safeNumber(input.operatingMargin);
  if (opMargin >= 20) score += 7;
  else if (opMargin >= 15) score += 6;
  else if (opMargin >= 10) score += 4;
  else if (opMargin >= 5) score += 2;

  return Math.min(score, 40);
}

/**
 * 재무건전성 점수 계산 (0-30점)
 */
function calculateFinancialHealthScore(input: QualityInput): number {
  let score = 0;

  // Debt-to-Equity < 0.5: 15점
  const debtToEquity = safeNumber(input.debtToEquity, 999);
  if (debtToEquity < 0.3) score += 15;
  else if (debtToEquity < 0.5) score += 12;
  else if (debtToEquity < 1.0) score += 8;
  else if (debtToEquity < 2.0) score += 4;
  // > 2.0: 0점

  // Current Ratio > 1.5: 15점
  const currentRatio = safeNumber(input.currentRatio);
  if (currentRatio >= 2.0) score += 15;
  else if (currentRatio >= 1.5) score += 12;
  else if (currentRatio >= 1.2) score += 8;
  else if (currentRatio >= 1.0) score += 4;
  // < 1.0: 0점

  return Math.min(score, 30);
}

/**
 * 성장 일관성 점수 계산 (0-30점)
 */
function calculateGrowthConsistencyScore(input: QualityInput): number {
  let score = 0;

  // Quarterly Revenue Growth YoY > 10%: 15점
  const revenueGrowth = safeNumber(input.quarterlyRevenueGrowthYoY);
  if (revenueGrowth >= 20) score += 15;
  else if (revenueGrowth >= 15) score += 12;
  else if (revenueGrowth >= 10) score += 10;
  else if (revenueGrowth >= 5) score += 6;
  else if (revenueGrowth >= 0) score += 3;
  // Negative growth: 0점

  // Quarterly Earnings Growth YoY > 10%: 15점
  const earningsGrowth = safeNumber(input.quarterlyEarningsGrowthYoY);
  if (earningsGrowth >= 20) score += 15;
  else if (earningsGrowth >= 15) score += 12;
  else if (earningsGrowth >= 10) score += 10;
  else if (earningsGrowth >= 5) score += 6;
  else if (earningsGrowth >= 0) score += 3;
  // Negative growth: 0점

  return Math.min(score, 30);
}

/**
 * Quality 인사이트 생성
 */
function generateQualityInsights(
  input: QualityInput,
  profitabilityScore: number,
  financialHealthScore: number,
  growthConsistencyScore: number
): Insight[] {
  const insights: Insight[] = [];

  // Profitability insights
  const roe = safeNumber(input.roe);
  if (roe >= 15) {
    insights.push({
      type: 'positive',
      message: `강력한 수익성 (ROE ${roe.toFixed(1)}%)`,
      score: profitabilityScore,
    });
  } else if (roe < 5) {
    insights.push({
      type: 'negative',
      message: `낮은 자기자본이익률 (ROE ${roe.toFixed(1)}%)`,
      score: profitabilityScore,
    });
  }

  const netMargin = safeNumber(input.netMargin);
  if (netMargin >= 15) {
    insights.push({
      type: 'positive',
      message: `우수한 순이익률 (${netMargin.toFixed(1)}%)`,
    });
  }

  // Financial Health insights
  const debtToEquity = safeNumber(input.debtToEquity, 999);
  if (debtToEquity < 0.5) {
    insights.push({
      type: 'positive',
      message: `건전한 부채비율 (${debtToEquity.toFixed(2)})`,
      score: financialHealthScore,
    });
  } else if (debtToEquity > 2.0) {
    insights.push({
      type: 'warning',
      message: `높은 부채비율 (${debtToEquity.toFixed(2)}) - 리스크 주의`,
      score: financialHealthScore,
    });
  }

  const currentRatio = safeNumber(input.currentRatio);
  if (currentRatio < 1.0) {
    insights.push({
      type: 'warning',
      message: `유동성 부족 (유동비율 ${currentRatio.toFixed(2)})`,
    });
  }

  // Growth Consistency insights
  const revenueGrowth = safeNumber(input.quarterlyRevenueGrowthYoY);
  const earningsGrowth = safeNumber(input.quarterlyEarningsGrowthYoY);

  if (revenueGrowth >= 10 && earningsGrowth >= 10) {
    insights.push({
      type: 'positive',
      message: `일관된 성장 (매출 ${revenueGrowth.toFixed(1)}%, 이익 ${earningsGrowth.toFixed(1)}%)`,
      score: growthConsistencyScore,
    });
  } else if (revenueGrowth < 0 || earningsGrowth < 0) {
    insights.push({
      type: 'negative',
      message: `역성장 중 (매출 ${revenueGrowth.toFixed(1)}%, 이익 ${earningsGrowth.toFixed(1)}%)`,
      score: growthConsistencyScore,
    });
  }

  return insights;
}
