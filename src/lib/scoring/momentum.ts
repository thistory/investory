/**
 * Momentum Score Calculator
 *
 * 모멘텀 점수 계산 (10% 가중치)
 * - 트렌드 (40점): Price vs SMA, Golden/Death Cross
 * - 지표 (30점): RSI, MACD
 * - 거래량 (30점): Volume trend
 *
 * 기술적 분석을 통한 진입 타이밍 평가
 */

import { MomentumInput, MomentumScore, Insight, safeNumber } from './types';

/**
 * Momentum Score 계산
 */
export function calculateMomentumScore(input: MomentumInput): MomentumScore {
  const trend = calculateTrendScore(input);
  const indicators = calculateIndicatorsScore(input);
  const volume = calculateVolumeScore(input);

  const total = trend + indicators + volume;
  const insights = generateMomentumInsights(input, trend, indicators, volume);

  return {
    total,
    trend,
    indicators,
    volume,
    insights,
  };
}

/**
 * 트렌드 점수 계산 (0-40점)
 */
function calculateTrendScore(input: MomentumInput): number {
  let score = 0;

  const currentPrice = safeNumber(input.currentPrice);
  const sma20 = safeNumber(input.sma20);
  const sma50 = safeNumber(input.sma50);
  const sma200 = safeNumber(input.sma200);

  // Price > SMA200: 15점 (장기 상승 추세)
  if (currentPrice > 0 && sma200 > 0) {
    const diff200 = ((currentPrice - sma200) / sma200) * 100;

    if (diff200 >= 10) score += 15;
    else if (diff200 >= 5) score += 13;
    else if (diff200 >= 0) score += 10;
    else if (diff200 >= -5) score += 5;
    else if (diff200 >= -10) score += 2;
    // < -10%: 0점 (하락 추세)
  }

  // Price > SMA50: 10점 (중기 상승 추세)
  if (currentPrice > 0 && sma50 > 0) {
    const diff50 = ((currentPrice - sma50) / sma50) * 100;

    if (diff50 >= 5) score += 10;
    else if (diff50 >= 2) score += 8;
    else if (diff50 >= 0) score += 6;
    else if (diff50 >= -2) score += 3;
    else if (diff50 >= -5) score += 1;
  }

  // Golden Cross (SMA50 > SMA200): 15점
  // Death Cross (SMA50 < SMA200): penalty
  if (sma50 > 0 && sma200 > 0) {
    const diff = ((sma50 - sma200) / sma200) * 100;

    if (diff >= 5) score += 15;        // Strong golden cross
    else if (diff >= 2) score += 13;   // Golden cross
    else if (diff >= 0) score += 10;   // Approaching golden cross
    else if (diff >= -2) score += 5;   // Approaching death cross
    // < -2%: 0점 (death cross)
  }

  return Math.min(score, 40);
}

/**
 * 지표 점수 계산 (0-30점)
 */
function calculateIndicatorsScore(input: MomentumInput): number {
  let score = 0;

  // RSI (14-period): 15점
  // Healthy momentum: 40-60
  // Oversold: < 30, Overbought: > 70
  const rsi = safeNumber(input.rsi, 50);

  if (rsi >= 40 && rsi <= 60) score += 15;      // Healthy momentum
  else if (rsi >= 30 && rsi <= 70) score += 12; // Normal range
  else if (rsi >= 25 && rsi <= 75) score += 8;  // Approaching extremes
  else if (rsi >= 20 && rsi <= 80) score += 4;  // Extreme zones
  // < 20 or > 80: 0점 (very extreme)

  // MACD Bullish Crossover: 15점
  const macd = safeNumber(input.macd);
  const macdSignal = safeNumber(input.macdSignal);

  if (macd !== 0 && macdSignal !== 0) {
    const diff = macd - macdSignal;

    if (diff > 0 && macd > 0) score += 15;       // Strong bullish
    else if (diff > 0 && macd < 0) score += 12;  // Bullish crossover
    else if (diff < 0 && macd > 0) score += 8;   // Weakening
    else if (diff < 0 && macd < 0) score += 3;   // Bearish
  } else {
    score += 7; // No MACD data, neutral score
  }

  return Math.min(score, 30);
}

/**
 * 거래량 점수 계산 (0-30점)
 */
function calculateVolumeScore(input: MomentumInput): number {
  let score = 0;

  const currentVolume = safeNumber(input.currentVolume);
  const averageVolume = safeNumber(input.averageVolume);

  if (currentVolume > 0 && averageVolume > 0) {
    const volumeRatio = currentVolume / averageVolume;

    // Volume > Average: 30점
    if (volumeRatio >= 2.0) score += 30;      // Very high volume (2x)
    else if (volumeRatio >= 1.5) score += 25; // High volume (1.5x)
    else if (volumeRatio >= 1.2) score += 20; // Above average
    else if (volumeRatio >= 1.0) score += 15; // Average
    else if (volumeRatio >= 0.8) score += 10; // Slightly below
    else if (volumeRatio >= 0.6) score += 5;  // Low volume
    // < 0.6x: 0점 (very low volume)
  } else {
    score += 15; // No volume data, neutral score
  }

  return Math.min(score, 30);
}

/**
 * Momentum 인사이트 생성
 */
function generateMomentumInsights(
  input: MomentumInput,
  trendScore: number,
  indicatorsScore: number,
  volumeScore: number
): Insight[] {
  const insights: Insight[] = [];

  const currentPrice = safeNumber(input.currentPrice);
  const sma50 = safeNumber(input.sma50);
  const sma200 = safeNumber(input.sma200);

  // Golden/Death Cross
  if (sma50 > 0 && sma200 > 0) {
    if (sma50 > sma200) {
      insights.push({
        type: 'positive',
        message: 'Golden Cross - 상승 추세',
        score: trendScore,
      });
    } else {
      insights.push({
        type: 'warning',
        message: 'Death Cross - 하락 추세',
        score: trendScore,
      });
    }
  }

  // SMA200 trend
  if (currentPrice > 0 && sma200 > 0) {
    const diff200 = ((currentPrice - sma200) / sma200) * 100;

    if (diff200 < -10) {
      insights.push({
        type: 'negative',
        message: `장기 하락 추세 (SMA200 대비 ${diff200.toFixed(1)}%)`,
      });
    } else if (diff200 > 10) {
      insights.push({
        type: 'positive',
        message: `장기 상승 추세 (SMA200 대비 +${diff200.toFixed(1)}%)`,
      });
    }
  }

  // RSI
  const rsi = safeNumber(input.rsi, 50);

  if (rsi < 30) {
    insights.push({
      type: 'positive',
      message: `과매도 구간 (RSI ${rsi.toFixed(0)}) - 반등 기회`,
      score: indicatorsScore,
    });
  } else if (rsi > 70) {
    insights.push({
      type: 'warning',
      message: `과매수 구간 (RSI ${rsi.toFixed(0)}) - 조정 위험`,
      score: indicatorsScore,
    });
  } else if (rsi >= 40 && rsi <= 60) {
    insights.push({
      type: 'positive',
      message: `건전한 모멘텀 (RSI ${rsi.toFixed(0)})`,
    });
  }

  // MACD
  const macd = safeNumber(input.macd);
  const macdSignal = safeNumber(input.macdSignal);

  if (macd !== 0 && macdSignal !== 0) {
    if (macd > macdSignal && macd > 0) {
      insights.push({
        type: 'positive',
        message: 'MACD 강세 신호',
      });
    } else if (macd < macdSignal && macd < 0) {
      insights.push({
        type: 'warning',
        message: 'MACD 약세 신호',
      });
    }
  }

  // Volume
  const currentVolume = safeNumber(input.currentVolume);
  const averageVolume = safeNumber(input.averageVolume);

  if (currentVolume > 0 && averageVolume > 0) {
    const volumeRatio = currentVolume / averageVolume;

    if (volumeRatio >= 1.5) {
      insights.push({
        type: 'positive',
        message: `높은 거래량 (평균 대비 ${(volumeRatio * 100).toFixed(0)}%)`,
        score: volumeScore,
      });
    } else if (volumeRatio < 0.6) {
      insights.push({
        type: 'warning',
        message: `낮은 거래량 (평균 대비 ${(volumeRatio * 100).toFixed(0)}%)`,
        score: volumeScore,
      });
    }
  }

  return insights;
}
