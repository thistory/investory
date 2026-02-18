/**
 * Growth Score Calculator
 *
 * 성장 점수 계산 (15% 가중치)
 * - 히스토리컬 성장 (40점): Revenue Growth, Earnings Growth
 * - 애널리스트 기대치 (30점): Forward P/E, Target Price
 * - 성장 품질 (30점): 마진 개선 여부
 *
 * Peter Lynch의 "Tenbagger" 개념 - 10배 성장주 발굴
 */

import { GrowthInput, GrowthScore, Insight, safeNumber } from './types';

/**
 * Growth Score 계산
 */
export function calculateGrowthScore(input: GrowthInput): GrowthScore {
  const historicalGrowth = calculateHistoricalGrowthScore(input);
  const analystExpectations = calculateAnalystExpectationsScore(input);
  const growthQuality = calculateGrowthQualityScore(input);

  const total = historicalGrowth + analystExpectations + growthQuality;
  const insights = generateGrowthInsights(input, historicalGrowth, analystExpectations, growthQuality);

  return {
    total,
    historicalGrowth,
    analystExpectations,
    growthQuality,
    insights,
  };
}

/**
 * 히스토리컬 성장 점수 계산 (0-40점)
 */
function calculateHistoricalGrowthScore(input: GrowthInput): number {
  let score = 0;

  // Quarterly Revenue Growth > 15%: 20점
  const revenueGrowth = safeNumber(input.quarterlyRevenueGrowthYoY);
  if (revenueGrowth >= 30) score += 20;
  else if (revenueGrowth >= 25) score += 18;
  else if (revenueGrowth >= 20) score += 16;
  else if (revenueGrowth >= 15) score += 14;
  else if (revenueGrowth >= 10) score += 10;
  else if (revenueGrowth >= 5) score += 6;
  else if (revenueGrowth >= 0) score += 3;
  // Negative: 0점

  // Quarterly Earnings Growth > 15%: 20점
  const earningsGrowth = safeNumber(input.quarterlyEarningsGrowthYoY);
  if (earningsGrowth >= 30) score += 20;
  else if (earningsGrowth >= 25) score += 18;
  else if (earningsGrowth >= 20) score += 16;
  else if (earningsGrowth >= 15) score += 14;
  else if (earningsGrowth >= 10) score += 10;
  else if (earningsGrowth >= 5) score += 6;
  else if (earningsGrowth >= 0) score += 3;
  // Negative: 0점

  return Math.min(score, 40);
}

/**
 * 애널리스트 기대치 점수 계산 (0-30점)
 */
function calculateAnalystExpectationsScore(input: GrowthInput): number {
  let score = 0;

  // Forward P/E < Trailing P/E: 15점 (성장 기대)
  const trailingPE = safeNumber(input.trailingPE, 0);
  const forwardPE = safeNumber(input.forwardPE, 0);

  if (trailingPE > 0 && forwardPE > 0) {
    const peDiff = ((trailingPE - forwardPE) / trailingPE) * 100;

    if (peDiff >= 20) score += 15;      // 20%+ 이익 증가 기대
    else if (peDiff >= 15) score += 13;
    else if (peDiff >= 10) score += 11;
    else if (peDiff >= 5) score += 8;
    else if (peDiff >= 0) score += 5;   // 약간의 이익 증가 기대
    // Negative (earnings decline expected): 0점
  }

  // Analyst Target Price Upside > 15%: 15점
  const currentPrice = safeNumber(input.currentPrice);
  const targetPrice = safeNumber(input.analystTargetPrice);

  if (currentPrice > 0 && targetPrice > 0) {
    const upside = ((targetPrice - currentPrice) / currentPrice) * 100;

    if (upside >= 30) score += 15;
    else if (upside >= 25) score += 13;
    else if (upside >= 20) score += 11;
    else if (upside >= 15) score += 9;
    else if (upside >= 10) score += 6;
    else if (upside >= 5) score += 3;
    // < 5%: 0점
  }

  return Math.min(score, 30);
}

/**
 * 성장 품질 점수 계산 (0-30점)
 * 마진 개선 = 건강한 성장
 */
function calculateGrowthQualityScore(input: GrowthInput): number {
  let score = 0;

  // High Net Margin (quality growth): 15점
  const netMargin = safeNumber(input.netMargin);
  if (netMargin >= 25) score += 15;
  else if (netMargin >= 20) score += 13;
  else if (netMargin >= 15) score += 11;
  else if (netMargin >= 10) score += 8;
  else if (netMargin >= 5) score += 5;

  // High Operating Margin: 15점
  const opMargin = safeNumber(input.operatingMargin);
  if (opMargin >= 30) score += 15;
  else if (opMargin >= 25) score += 13;
  else if (opMargin >= 20) score += 11;
  else if (opMargin >= 15) score += 8;
  else if (opMargin >= 10) score += 5;

  return Math.min(score, 30);
}

/**
 * Growth 인사이트 생성
 */
function generateGrowthInsights(
  input: GrowthInput,
  historicalGrowthScore: number,
  analystExpectationsScore: number,
  growthQualityScore: number
): Insight[] {
  const insights: Insight[] = [];

  // Historical growth insights
  const revenueGrowth = safeNumber(input.quarterlyRevenueGrowthYoY);
  const earningsGrowth = safeNumber(input.quarterlyEarningsGrowthYoY);

  if (revenueGrowth >= 20 && earningsGrowth >= 20) {
    insights.push({
      type: 'positive',
      message: `강력한 성장 (매출 ${revenueGrowth.toFixed(1)}%, 이익 ${earningsGrowth.toFixed(1)}%)`,
      score: historicalGrowthScore,
    });
  } else if (revenueGrowth < 0 && earningsGrowth < 0) {
    insights.push({
      type: 'negative',
      message: `성장 둔화 (매출 ${revenueGrowth.toFixed(1)}%, 이익 ${earningsGrowth.toFixed(1)}%)`,
      score: historicalGrowthScore,
    });
  } else if (revenueGrowth >= 10 && earningsGrowth >= 10) {
    insights.push({
      type: 'positive',
      message: `견고한 성장 (매출 ${revenueGrowth.toFixed(1)}%, 이익 ${earningsGrowth.toFixed(1)}%)`,
      score: historicalGrowthScore,
    });
  }

  // Analyst expectations insights
  const currentPrice = safeNumber(input.currentPrice);
  const targetPrice = safeNumber(input.analystTargetPrice);

  if (currentPrice > 0 && targetPrice > 0) {
    const upside = ((targetPrice - currentPrice) / currentPrice) * 100;

    if (upside >= 20) {
      insights.push({
        type: 'positive',
        message: `애널리스트 목표가 상승여력 ${upside.toFixed(0)}%`,
        score: analystExpectationsScore,
      });
    } else if (upside < 0) {
      insights.push({
        type: 'warning',
        message: `애널리스트 목표가 하회 중 (${upside.toFixed(0)}%)`,
        score: analystExpectationsScore,
      });
    }
  }

  const trailingPE = safeNumber(input.trailingPE, 0);
  const forwardPE = safeNumber(input.forwardPE, 0);

  if (trailingPE > 0 && forwardPE > 0) {
    const peDiff = ((trailingPE - forwardPE) / trailingPE) * 100;

    if (peDiff >= 10) {
      insights.push({
        type: 'positive',
        message: `향후 이익 증가 기대 (Forward P/E ${forwardPE.toFixed(1)})`,
      });
    } else if (peDiff < -10) {
      insights.push({
        type: 'warning',
        message: `향후 이익 감소 우려 (Forward P/E ${forwardPE.toFixed(1)})`,
      });
    }
  }

  // Growth quality insights
  const netMargin = safeNumber(input.netMargin);
  const opMargin = safeNumber(input.operatingMargin);

  if (netMargin >= 20 && opMargin >= 25) {
    insights.push({
      type: 'positive',
      message: `높은 마진 유지 (순이익률 ${netMargin.toFixed(1)}%, 영업이익률 ${opMargin.toFixed(1)}%)`,
      score: growthQualityScore,
    });
  } else if (netMargin < 5 || opMargin < 5) {
    insights.push({
      type: 'warning',
      message: `낮은 마진 - 성장 품질 우려 (순이익률 ${netMargin.toFixed(1)}%)`,
      score: growthQualityScore,
    });
  }

  return insights;
}
