/**
 * Value Score Calculator
 *
 * 가치 점수 계산 (20% 가중치)
 * - 밸류에이션 멀티플 (50점): P/E, PEG, P/B, EV/EBITDA vs 섹터 평균
 * - 가격 위치 (30점): 52주 범위 내 위치
 * - 안전마진 (20점): 저평가 정도
 *
 * Peter Lynch의 GARP (Growth at Reasonable Price) 전략 반영
 * PEG < 1.0이 매력적인 투자 대상
 */

import { ValueInput, ValueScore, Insight, safeNumber, SECTOR_AVERAGES } from './types';

/**
 * Value Score 계산
 */
export function calculateValueScore(input: ValueInput): ValueScore {
  const valuationMultiples = calculateValuationMultiplesScore(input);
  const pricePosition = calculatePricePositionScore(input);
  const marginOfSafety = calculateMarginOfSafetyScore(input);

  const total = valuationMultiples + pricePosition + marginOfSafety;
  const insights = generateValueInsights(input, valuationMultiples, pricePosition, marginOfSafety);

  return {
    total,
    valuationMultiples,
    pricePosition,
    marginOfSafety,
    insights,
  };
}

/**
 * 밸류에이션 멀티플 점수 계산 (0-50점)
 * 섹터 평균 대비 저평가일수록 높은 점수
 */
function calculateValuationMultiplesScore(input: ValueInput): number {
  let score = 0;

  const sectorAvg = SECTOR_AVERAGES[input.sector || 'Default'] || SECTOR_AVERAGES['Default'];

  // PEG < 1.0: 20점 (Peter Lynch's GARP)
  const pegRatio = safeNumber(input.pegRatio, 999);
  if (pegRatio < 0.5) score += 20;
  else if (pegRatio < 0.8) score += 18;
  else if (pegRatio < 1.0) score += 16;
  else if (pegRatio < 1.5) score += 12;
  else if (pegRatio < 2.0) score += 6;
  // >= 2.0 or invalid: 0점

  // P/E vs Sector Average: 15점
  const peRatio = safeNumber(input.peRatio, 999);
  if (peRatio > 0) {
    const peVsSector = peRatio / sectorAvg.pe;
    if (peVsSector < 0.7) score += 15;       // 30%+ undervalued
    else if (peVsSector < 0.85) score += 12; // 15-30% undervalued
    else if (peVsSector < 1.0) score += 10;  // Up to 15% undervalued
    else if (peVsSector < 1.2) score += 6;   // Fairly valued
    else if (peVsSector < 1.5) score += 3;   // Slightly overvalued
    // >= 1.5x sector: 0점
  }

  // P/B vs Sector Average: 8점
  const pbRatio = safeNumber(input.pbRatio, 999);
  if (pbRatio > 0) {
    const pbVsSector = pbRatio / sectorAvg.pb;
    if (pbVsSector < 0.7) score += 8;
    else if (pbVsSector < 0.85) score += 6;
    else if (pbVsSector < 1.0) score += 5;
    else if (pbVsSector < 1.2) score += 3;
  }

  // EV/EBITDA vs Sector Average: 7점
  const evToEbitda = safeNumber(input.evToEbitda, 999);
  if (evToEbitda > 0) {
    const evVsSector = evToEbitda / sectorAvg.evToEbitda;
    if (evVsSector < 0.7) score += 7;
    else if (evVsSector < 0.85) score += 5;
    else if (evVsSector < 1.0) score += 4;
    else if (evVsSector < 1.2) score += 2;
  }

  return Math.min(score, 50);
}

/**
 * 가격 위치 점수 계산 (0-30점)
 * 52주 저점에 가까울수록 높은 점수
 */
function calculatePricePositionScore(input: ValueInput): number {
  const currentPrice = safeNumber(input.currentPrice);
  const fiftyTwoWeekHigh = safeNumber(input.fiftyTwoWeekHigh);
  const fiftyTwoWeekLow = safeNumber(input.fiftyTwoWeekLow);

  if (currentPrice <= 0 || fiftyTwoWeekHigh <= 0 || fiftyTwoWeekLow <= 0) {
    return 0;
  }

  // 52주 범위 내에서 현재 위치 계산 (0 = 저점, 100 = 고점)
  const range = fiftyTwoWeekHigh - fiftyTwoWeekLow;
  const position = ((currentPrice - fiftyTwoWeekLow) / range) * 100;

  let score = 0;

  if (position <= 20) score = 30;        // 저점 근처 (매수 기회)
  else if (position <= 40) score = 25;   // 저점대
  else if (position <= 60) score = 18;   // 중간
  else if (position <= 80) score = 10;   // 고점대
  else score = 5;                        // 고점 근처 (매수 주의)

  return score;
}

/**
 * 안전마진 점수 계산 (0-20점)
 * 현재 저평가 정도
 */
function calculateMarginOfSafetyScore(input: ValueInput): number {
  let score = 0;

  // PEG 기반 안전마진
  const pegRatio = safeNumber(input.pegRatio, 999);
  if (pegRatio < 0.5) score += 10;
  else if (pegRatio < 0.7) score += 8;
  else if (pegRatio < 1.0) score += 6;
  else if (pegRatio < 1.3) score += 3;

  // 52주 저점과의 거리 기반 안전마진
  const currentPrice = safeNumber(input.currentPrice);
  const fiftyTwoWeekLow = safeNumber(input.fiftyTwoWeekLow);

  if (currentPrice > 0 && fiftyTwoWeekLow > 0) {
    const distanceFromLow = ((currentPrice - fiftyTwoWeekLow) / fiftyTwoWeekLow) * 100;

    if (distanceFromLow < 10) score += 10;       // 저점 대비 10% 이내
    else if (distanceFromLow < 20) score += 8;   // 저점 대비 20% 이내
    else if (distanceFromLow < 30) score += 5;   // 저점 대비 30% 이내
    else if (distanceFromLow < 50) score += 3;   // 저점 대비 50% 이내
  }

  return Math.min(score, 20);
}

/**
 * Value 인사이트 생성
 */
function generateValueInsights(
  input: ValueInput,
  valuationMultiplesScore: number,
  pricePositionScore: number,
  marginOfSafetyScore: number
): Insight[] {
  const insights: Insight[] = [];

  // PEG 인사이트 (Peter Lynch의 핵심 지표)
  const pegRatio = safeNumber(input.pegRatio, 999);
  if (pegRatio < 1.0 && pegRatio > 0) {
    insights.push({
      type: 'positive',
      message: `저평가 GARP 종목 (PEG ${pegRatio.toFixed(2)})`,
      score: valuationMultiplesScore,
    });
  } else if (pegRatio > 2.0) {
    insights.push({
      type: 'warning',
      message: `고평가 (PEG ${pegRatio.toFixed(2)}) - 성장 대비 비쌈`,
      score: valuationMultiplesScore,
    });
  }

  // P/E 섹터 비교
  const sectorAvg = SECTOR_AVERAGES[input.sector || 'Default'] || SECTOR_AVERAGES['Default'];
  const peRatio = safeNumber(input.peRatio, 999);
  if (peRatio > 0) {
    const peVsSector = ((peRatio / sectorAvg.pe) - 1) * 100;
    if (peVsSector < -15) {
      insights.push({
        type: 'positive',
        message: `섹터 대비 저평가 (P/E ${peVsSector.toFixed(0)}%)`,
      });
    } else if (peVsSector > 30) {
      insights.push({
        type: 'warning',
        message: `섹터 대비 고평가 (P/E +${peVsSector.toFixed(0)}%)`,
      });
    }
  }

  // 52주 가격 위치
  const currentPrice = safeNumber(input.currentPrice);
  const fiftyTwoWeekHigh = safeNumber(input.fiftyTwoWeekHigh);
  const fiftyTwoWeekLow = safeNumber(input.fiftyTwoWeekLow);

  if (currentPrice > 0 && fiftyTwoWeekHigh > 0 && fiftyTwoWeekLow > 0) {
    const range = fiftyTwoWeekHigh - fiftyTwoWeekLow;
    const position = ((currentPrice - fiftyTwoWeekLow) / range) * 100;

    if (position <= 25) {
      insights.push({
        type: 'positive',
        message: `52주 저점 근처 (${position.toFixed(0)}% 위치) - 매수 기회`,
        score: pricePositionScore,
      });
    } else if (position >= 85) {
      insights.push({
        type: 'warning',
        message: `52주 고점 근처 (${position.toFixed(0)}% 위치) - 매수 주의`,
        score: pricePositionScore,
      });
    }
  }

  // 안전마진
  if (marginOfSafetyScore >= 15) {
    insights.push({
      type: 'positive',
      message: '충분한 안전마진 확보',
      score: marginOfSafetyScore,
    });
  } else if (marginOfSafetyScore < 8) {
    insights.push({
      type: 'warning',
      message: '안전마진 부족 - 리스크 높음',
      score: marginOfSafetyScore,
    });
  }

  return insights;
}
