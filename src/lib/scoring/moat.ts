/**
 * Moat Score Calculator
 *
 * 해자(Moat) 점수 계산 (25% 가중치)
 * - 가격결정력 (40점): Gross Margin, Operating Margin
 * - 시장 지배력 (30점): Market Cap, Beta
 * - 지속성 (30점): ROE/ROA 일관성
 *
 * Warren Buffett의 경쟁우위(Moat) 개념 구현
 * Wide Moat: 80-100, Narrow Moat: 60-79, No Moat: 0-59
 */

import { MoatInput, MoatScore, Insight, safeNumber } from './types';

/**
 * Moat Score 계산
 */
export function calculateMoatScore(input: MoatInput): MoatScore {
  const pricingPower = calculatePricingPowerScore(input);
  const marketPosition = calculateMarketPositionScore(input);
  const durability = calculateDurabilityScore(input);

  const total = pricingPower + marketPosition + durability;
  const moatClassification = classifyMoat(total);
  const insights = generateMoatInsights(input, total, moatClassification);

  return {
    total,
    pricingPower,
    marketPosition,
    durability,
    moatClassification,
    insights,
  };
}

/**
 * 가격결정력 점수 계산 (0-40점)
 * 높은 마진 = 가격결정력이 강함
 */
function calculatePricingPowerScore(input: MoatInput): number {
  let score = 0;

  // Gross Margin > 40%: 20점
  const grossMargin = safeNumber(input.grossMargin);
  if (grossMargin >= 60) score += 20;
  else if (grossMargin >= 50) score += 17;
  else if (grossMargin >= 40) score += 15;
  else if (grossMargin >= 30) score += 10;
  else if (grossMargin >= 20) score += 5;

  // Operating Margin > 20%: 20점
  const opMargin = safeNumber(input.operatingMargin);
  if (opMargin >= 30) score += 20;
  else if (opMargin >= 25) score += 17;
  else if (opMargin >= 20) score += 15;
  else if (opMargin >= 15) score += 10;
  else if (opMargin >= 10) score += 5;

  return Math.min(score, 40);
}

/**
 * 시장 지배력 점수 계산 (0-30점)
 */
function calculateMarketPositionScore(input: MoatInput): number {
  let score = 0;

  // Market Cap > $10B: 15점
  const marketCap = safeNumber(input.marketCap);
  const marketCapB = marketCap / 1_000_000_000; // Convert to billions

  if (marketCapB >= 100) score += 15;      // Mega cap
  else if (marketCapB >= 50) score += 13;  // Large cap+
  else if (marketCapB >= 10) score += 12;  // Large cap
  else if (marketCapB >= 2) score += 8;    // Mid cap
  else if (marketCapB >= 0.3) score += 4;  // Small cap
  // < $300M: 0점

  // Beta < 1.2: 15점 (stable business)
  const beta = safeNumber(input.beta, 1.0);
  if (beta < 0.8) score += 15;
  else if (beta < 1.0) score += 13;
  else if (beta < 1.2) score += 10;
  else if (beta < 1.5) score += 6;
  else if (beta < 2.0) score += 3;
  // >= 2.0: 0점

  return Math.min(score, 30);
}

/**
 * 지속성 점수 계산 (0-30점)
 * ROE/ROA의 높은 값과 안정성
 */
function calculateDurabilityScore(input: MoatInput): number {
  let score = 0;

  // ROE > 15% for durability: 15점
  const roe = safeNumber(input.roe);
  if (roe >= 20) score += 15;
  else if (roe >= 18) score += 13;
  else if (roe >= 15) score += 12;
  else if (roe >= 12) score += 8;
  else if (roe >= 10) score += 5;

  // ROA > 8% for durability: 15점
  const roa = safeNumber(input.roa);
  if (roa >= 12) score += 15;
  else if (roa >= 10) score += 13;
  else if (roa >= 8) score += 12;
  else if (roa >= 6) score += 8;
  else if (roa >= 4) score += 5;

  return Math.min(score, 30);
}

/**
 * Moat 분류
 */
function classifyMoat(totalScore: number): 'Wide' | 'Narrow' | 'None' {
  if (totalScore >= 80) return 'Wide';
  if (totalScore >= 60) return 'Narrow';
  return 'None';
}

/**
 * Moat 인사이트 생성
 */
function generateMoatInsights(
  input: MoatInput,
  totalScore: number,
  moatClassification: 'Wide' | 'Narrow' | 'None'
): Insight[] {
  const insights: Insight[] = [];

  // Moat classification insight
  if (moatClassification === 'Wide') {
    insights.push({
      type: 'positive',
      message: 'Wide Moat - 강력한 경쟁우위 보유',
      score: totalScore,
    });
  } else if (moatClassification === 'Narrow') {
    insights.push({
      type: 'positive',
      message: 'Narrow Moat - 일부 경쟁우위 보유',
      score: totalScore,
    });
  } else {
    insights.push({
      type: 'warning',
      message: 'No Moat - 경쟁우위 제한적',
      score: totalScore,
    });
  }

  // Pricing power insights
  const grossMargin = safeNumber(input.grossMargin);
  if (grossMargin >= 50) {
    insights.push({
      type: 'positive',
      message: `강력한 가격결정력 (매출총이익률 ${grossMargin.toFixed(1)}%)`,
    });
  } else if (grossMargin < 20) {
    insights.push({
      type: 'warning',
      message: `낮은 가격결정력 (매출총이익률 ${grossMargin.toFixed(1)}%)`,
    });
  }

  // Market position insights
  const marketCap = safeNumber(input.marketCap);
  const marketCapB = marketCap / 1_000_000_000;
  if (marketCapB >= 100) {
    insights.push({
      type: 'positive',
      message: `대형주 안정성 (시가총액 $${marketCapB.toFixed(0)}B)`,
    });
  }

  const beta = safeNumber(input.beta, 1.0);
  if (beta > 1.5) {
    insights.push({
      type: 'warning',
      message: `높은 변동성 (베타 ${beta.toFixed(2)}) - 불안정한 비즈니스`,
    });
  }

  // Durability insights
  const roe = safeNumber(input.roe);
  if (roe >= 15) {
    insights.push({
      type: 'positive',
      message: `지속 가능한 수익성 (ROE ${roe.toFixed(1)}%)`,
    });
  }

  return insights;
}
