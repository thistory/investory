/**
 * Composite Score Calculator
 *
 * 종합 투자 점수 계산
 * - Quality: 30%
 * - Moat: 25%
 * - Value: 20%
 * - Growth: 15%
 * - Momentum: 10%
 *
 * 최종 점수 0-100, 등급 A+~F
 */

import { calculateQualityScore } from './quality';
import { calculateMoatScore } from './moat';
import { calculateValueScore } from './value';
import { calculateGrowthScore } from './growth';
import { calculateMomentumScore } from './momentum';
import {
  CompositeScore,
  QualityInput,
  MoatInput,
  ValueInput,
  GrowthInput,
  MomentumInput,
  Insight,
  scoreToGrade,
} from './types';

/**
 * 종합 점수 계산을 위한 통합 입력 데이터
 */
export interface ComprehensiveInput {
  // Stock identifier
  symbol: string;

  // Component inputs
  quality: QualityInput;
  moat: MoatInput;
  value: ValueInput;
  growth: GrowthInput;
  momentum: MomentumInput;
}

/**
 * 종합 점수 가중치
 */
const WEIGHTS = {
  quality: 0.30,    // 30%
  moat: 0.25,       // 25%
  value: 0.20,      // 20%
  growth: 0.15,     // 15%
  momentum: 0.10,   // 10%
};

/**
 * 종합 투자 점수 계산
 */
export function calculateCompositeScore(input: ComprehensiveInput): CompositeScore {
  // 개별 점수 계산
  const quality = calculateQualityScore(input.quality);
  const moat = calculateMoatScore(input.moat);
  const value = calculateValueScore(input.value);
  const growth = calculateGrowthScore(input.growth);
  const momentum = calculateMomentumScore(input.momentum);

  // 가중 평균으로 총점 계산
  const totalScore =
    quality.total * WEIGHTS.quality +
    moat.total * WEIGHTS.moat +
    value.total * WEIGHTS.value +
    growth.total * WEIGHTS.growth +
    momentum.total * WEIGHTS.momentum;

  // 등급 산출
  const grade = scoreToGrade(totalScore);

  // 종합 인사이트 생성
  const insights = generateCompositeInsights(
    totalScore,
    grade,
    quality,
    moat,
    value,
    growth,
    momentum
  );

  return {
    totalScore,
    grade,
    quality,
    moat,
    value,
    growth,
    momentum,
    insights,
    calculatedAt: new Date(),
    symbol: input.symbol,
  };
}

/**
 * 종합 인사이트 생성
 * 가장 중요한 강점과 약점을 요약
 */
function generateCompositeInsights(
  totalScore: number,
  grade: string,
  quality: any,
  moat: any,
  value: any,
  growth: any,
  momentum: any
): Insight[] {
  const insights: Insight[] = [];

  // 전체 등급 인사이트
  if (grade === 'A+' || grade === 'A') {
    insights.push({
      type: 'positive',
      message: `우수한 투자 대상 (등급 ${grade}, ${totalScore.toFixed(0)}점)`,
      score: totalScore,
    });
  } else if (grade === 'B') {
    insights.push({
      type: 'positive',
      message: `양호한 투자 대상 (등급 ${grade}, ${totalScore.toFixed(0)}점)`,
      score: totalScore,
    });
  } else if (grade === 'C') {
    insights.push({
      type: 'warning',
      message: `보통 수준 (등급 ${grade}, ${totalScore.toFixed(0)}점) - 추가 조사 필요`,
      score: totalScore,
    });
  } else {
    insights.push({
      type: 'warning',
      message: `투자 주의 (등급 ${grade}, ${totalScore.toFixed(0)}점)`,
      score: totalScore,
    });
  }

  // 각 요소별 상위 3개 인사이트 수집
  const allInsights = [
    ...quality.insights.map((i: Insight) => ({ ...i, source: 'Quality' })),
    ...moat.insights.map((i: Insight) => ({ ...i, source: 'Moat' })),
    ...value.insights.map((i: Insight) => ({ ...i, source: 'Value' })),
    ...growth.insights.map((i: Insight) => ({ ...i, source: 'Growth' })),
    ...momentum.insights.map((i: Insight) => ({ ...i, source: 'Momentum' })),
  ];

  // 긍정적 인사이트 (최대 2개)
  const positiveInsights = allInsights
    .filter((i) => i.type === 'positive')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 2);

  insights.push(...positiveInsights.map((i) => ({
    type: i.type,
    message: i.message,
    score: i.score,
  })));

  // 경고/부정적 인사이트 (최대 2개)
  const warningInsights = allInsights
    .filter((i) => i.type === 'warning' || i.type === 'negative')
    .sort((a, b) => (a.score || 100) - (b.score || 100))
    .slice(0, 2);

  insights.push(...warningInsights.map((i) => ({
    type: i.type,
    message: i.message,
    score: i.score,
  })));

  // 가장 강한 요소 식별
  const scores = [
    { name: 'Quality', score: quality.total, weight: WEIGHTS.quality },
    { name: 'Moat', score: moat.total, weight: WEIGHTS.moat },
    { name: 'Value', score: value.total, weight: WEIGHTS.value },
    { name: 'Growth', score: growth.total, weight: WEIGHTS.growth },
    { name: 'Momentum', score: momentum.total, weight: WEIGHTS.momentum },
  ];

  const strongest = scores.reduce((a, b) => (a.score > b.score ? a : b));
  const weakest = scores.reduce((a, b) => (a.score < b.score ? a : b));

  if (strongest.score >= 80) {
    const strengthNames: Record<string, string> = {
      'Quality': '품질',
      'Moat': '경쟁우위',
      'Value': '가치',
      'Growth': '성장성',
      'Momentum': '모멘텀',
    };

    insights.push({
      type: 'positive',
      message: `강점: ${strengthNames[strongest.name]} 우수 (${strongest.score.toFixed(0)}점)`,
      score: strongest.score,
    });
  }

  if (weakest.score < 40) {
    const weaknessNames: Record<string, string> = {
      'Quality': '품질',
      'Moat': '경쟁우위',
      'Value': '가치',
      'Growth': '성장성',
      'Momentum': '모멘텀',
    };

    insights.push({
      type: 'warning',
      message: `약점: ${weaknessNames[weakest.name]} 부족 (${weakest.score.toFixed(0)}점)`,
      score: weakest.score,
    });
  }

  return insights;
}

